from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum, Q, F
from django.db.models.functions import TruncMonth, TruncDate, TruncWeek
from datetime import timedelta
from ..models import (
    Loans,
    SystemCapital,
    Repayments,
    LedgerEntry,
    RepaymentSchedule,
    Branch,
)

class LoanAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        branch = request.query_params.get("branch") or request.query_params.get(
            "region"
        )
        
        loans = Loans.objects.all()

        if hasattr(user, "role") and user.role == "MANAGER":
            loans = loans.filter(user__profile__branch_fk=user.branch_fk)
        elif branch:
            loans = loans.filter(user__profile__branch=branch) # fallback for text search

        if hasattr(user, "role") and user.role == "FIELD_OFFICER":
            loans = loans.filter(created_by=user)

        monthly_stats = (
            loans.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Sum("principal_amount"), count=Count("id"))
            .order_by("month")
        )

        daily_disbursements = (
            loans.filter(status="DISBURSED")
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(total=Sum("principal_amount"), count=Count("id"))
            .order_by("-date")[:30]
        )

        status_stats = loans.values("status").annotate(count=Count("id"))

        data = {
            "monthly_disbursements": [
                {
                    "month": stat["month"].strftime("%b"),
                    "amount": float(stat["total"] or 0),
                    "count": stat["count"],
                }
                for stat in monthly_stats
            ],
            "daily_disbursements": [
                {
                    "date": stat["date"].strftime("%Y-%m-%d"),
                    "amount": float(stat["total"] or 0),
                    "count": stat["count"],
                }
                for stat in daily_disbursements
            ],
            "status_breakdown": [
                {"name": stat["status"], "value": stat["count"]}
                for stat in status_stats
            ],
        }
        return Response(data)


class FinanceAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()

        # Get Capital Balance
        capital = SystemCapital.objects.filter(name="Simulation Capital").first()
        balance = float(capital.balance) if capital else 0.0

        # Last 60 days range
        sixty_days_ago = timezone.now() - timedelta(days=60)

        # Money Out (Total Principal of Disbursed Loans - ONLY DISBURSED)
        # We include all statuses that represent funds already given to customers
        disbursed_statuses = ["DISBURSED", "ACTIVE", "OVERDUE", "CLOSED", "REPAID"]
        money_out_query = Loans.objects.filter(status__in=disbursed_statuses)
        money_out = (
            money_out_query.aggregate(total=Sum("principal_amount"))["total"] or 0
        )

        # Money In (Total amount repaid)
        money_in = Repayments.objects.aggregate(total=Sum("amount_paid"))["total"] or 0

        # Aging Report Analysis
        # 1-30 days, 31-60 days, 61-90 days, 90+ days overdue
        aging_30 = (
            Loans.objects.filter(
                status="OVERDUE",
                repaymentschedule__due_date__lt=today,
                repaymentschedule__due_date__gte=today - timedelta(days=30),
            )
            .distinct()
            .aggregate(total=Sum("principal_amount"))["total"]
            or 0
        )
        aging_60 = (
            Loans.objects.filter(
                status="OVERDUE",
                repaymentschedule__due_date__lt=today - timedelta(days=30),
                repaymentschedule__due_date__gte=today - timedelta(days=60),
            )
            .distinct()
            .aggregate(total=Sum("principal_amount"))["total"]
            or 0
        )
        aging_90 = (
            Loans.objects.filter(
                status="OVERDUE",
                repaymentschedule__due_date__lt=today - timedelta(days=60),
            )
            .distinct()
            .aggregate(total=Sum("principal_amount"))["total"]
            or 0
        )

        # Rolling 15-day window for Line Charts (7 days history, Today, 7 days future)
        seven_days_ago = today - timedelta(days=7)
        seven_days_future = today + timedelta(days=7)

        # Actuals (History)
        actual_disbursements = (
            Loans.objects.filter(
                status__in=disbursed_statuses,
                created_at__date__gte=seven_days_ago,
                created_at__date__lte=today,
            )
            .annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(amount=Sum("principal_amount"))
        )

        actual_repayments = (
            Repayments.objects.filter(
                payment_date__date__gte=seven_days_ago, payment_date__date__lte=today
            )
            .annotate(date=TruncDate("payment_date"))
            .values("date")
            .annotate(amount=Sum("amount_paid"))
        )

        # Projections (Future Schedules)
        scheduled_repayments = (
            RepaymentSchedule.objects.filter(
                due_date__gt=today, due_date__lte=seven_days_future
            )
            .values("due_date")
            .annotate(amount=Sum("amount_due"))
        )

        # Build timeline map
        timeline_map = {}
        curr = seven_days_ago
        while curr <= seven_days_future:
            d_str = curr.strftime("%Y-%m-%d")
            timeline_map[d_str] = {
                "date": d_str,
                "disbursement": 0.0,
                "repayment": 0.0,
                "is_future": curr > today,
                "label": "TODAY" if curr == today else curr.strftime("%d %b"),
            }
            curr += timedelta(days=1)

        for item in actual_disbursements:
            d_str = str(item["date"])[:10]
            if d_str in timeline_map:
                timeline_map[d_str]["disbursement"] = float(item["amount"] or 0)

        for item in actual_repayments:
            d_str = str(item["date"])[:10]
            if d_str in timeline_map:
                timeline_map[d_str]["repayment"] = float(item["amount"] or 0)

        for item in scheduled_repayments:
            # schedule due_date is a date object
            d_str = str(item["due_date"])[:10]
            if d_str in timeline_map:
                timeline_map[d_str]["repayment"] += float(item["amount"] or 0)

        # Weekly History for BarCharts (Last 10 weeks)
        ten_weeks_ago = today - timedelta(weeks=10)

        weekly_disbursed_query = (
            Loans.objects.filter(
                status__in=disbursed_statuses, created_at__date__gte=ten_weeks_ago
            )
            .annotate(week=TruncWeek("created_at"))
            .values("week")
            .annotate(amount=Sum("principal_amount"))
            .order_by("week")
        )

        weekly_repaid_query = (
            Repayments.objects.filter(payment_date__date__gte=ten_weeks_ago)
            .annotate(week=TruncWeek("payment_date"))
            .values("week")
            .annotate(amount=Sum("amount_paid"))
            .order_by("week")
        )

        # Pre-fill last 10 weeks
        weekly_disbursed = []
        weekly_repaid = []

        # Create a map of existing data for quick lookup
        disp_map = {
            str(x["week"])[:10]: float(x["amount"]) for x in weekly_disbursed_query
        }
        repay_map = {
            str(x["week"])[:10]: float(x["amount"]) for x in weekly_repaid_query
        }

        for i in range(9, -1, -1):  # Last 10 weeks
            target_date = today - timedelta(weeks=i)
            # Find the start of the week for this date
            start_of_week = target_date - timedelta(days=target_date.weekday())
            w_key = start_of_week.strftime("%Y-%m-%d")

            weekly_disbursed.append(
                {
                    "week": start_of_week.strftime("%d %b"),
                    "amount": disp_map.get(w_key, 0.0),
                }
            )
            weekly_repaid.append(
                {
                    "week": start_of_week.strftime("%d %b"),
                    "amount": repay_map.get(w_key, 0.0),
                }
            )

        # Trial Balance Context (Grouped Capital/Assets/Liabilities)
        trial_balance = [
            {"account": "Simulation Capital", "debit": 0, "credit": balance},
            {
                "account": "Loan Portfolio (Principal)",
                "debit": float(money_out),
                "credit": 0,
            },
            {"account": "Interest Receivable", "debit": 0, "credit": 0},
            {"account": "Repayments Pool", "debit": float(money_in), "credit": 0},
        ]

        # Collection Log (Last 50 entries)
        collections = Repayments.objects.select_related("loan__user").order_by(
            "-payment_date"
        )[:50]
        collection_log = [
            {
                "id": str(r.id),
                "customer": r.loan.user.full_name,
                "amount": float(r.amount_paid),
                "date": r.payment_date.strftime("%Y-%m-%d %H:%M"),
                "method": r.payment_method,
                "reference": r.reference_code,
            }
            for r in collections
        ]

        # Cashbook (Last 100 Ledger entries)
        ledger_entries = LedgerEntry.objects.select_related("loan__user").order_by(
            "-created_at"
        )[:100]
        cashbook = [
            {
                "id": str(entry.id),
                "date": entry.created_at.strftime("%Y-%m-%d %H:%M"),
                "type": entry.entry_type,
                "amount": float(entry.amount),
                "customer": (
                    entry.loan.user.full_name
                    if entry.loan and entry.loan.user
                    else "SYSTEM"
                ),
                "reference": entry.reference_id or "N/A",
                "note": entry.note or "",
            }
            for entry in ledger_entries
        ]

        from ..models import LoanProducts, Users
        product_dist = (
            Loans.objects.filter(status__in=disbursed_statuses)
            .values('loan_product__name')
            .annotate(
                value=Sum('principal_amount'),
                count=Count('id')
            )
            .order_by('-value')
        )
        product_distribution = [
            {
                'name': p['loan_product__name'] or 'Unknown',
                'value': float(p['value'] or 0),
                'count': p['count']
            }
            for p in product_dist
        ]

        total_customers = Users.objects.count()
        active_loans = Loans.objects.filter(
            status__in=['DISBURSED', 'ACTIVE', 'OVERDUE']
        ).count()

        return Response(
            {
                "balance": balance,
                "money_out": float(money_out),
                "money_in": float(money_in),
                "history": list(timeline_map.values()),
                "weekly_disbursed": weekly_disbursed,
                "weekly_repaid": weekly_repaid,
                "trial_balance": trial_balance,
                "cashbook": cashbook,
                "aging_report": {
                    "days_30": float(aging_30),
                    "days_60": float(aging_60),
                    "days_90": float(aging_90),
                },
                "collection_log": collection_log,
                "product_distribution": product_distribution,
                "total_customers": total_customers,
                "active_loans": active_loans,
            }
        )

  
class OwnerAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_owner', False):
            return Response({"error": "Owner only."}, status=403)

        from django.db.models.functions import TruncMonth, TruncDate
        today = timezone.now().date()
        thirty_days_ago = today - timedelta(days=30)
        disbursed_statuses = [
            "DISBURSED", "ACTIVE", "OVERDUE", "CLOSED", "REPAID"
        ]

        from ..models import (
            Loans, Repayments, Users, Admins, Branch, SystemCapital, RepaymentSchedule
        )

        # --- BRANCH PERFORMANCE ---
        branches = Branch.objects.all()
        branch_performance = []
        for branch in branches:
            branch_loans = Loans.objects.filter(
                branch=branch,
                status__in=disbursed_statuses
            )
            branch_overdue = branch_loans.filter(
                status='OVERDUE')
            branch_repayments = Repayments.objects.filter(
                loan__branch=branch
            )
            principal = branch_loans.aggregate(
                t=Sum('principal_amount'))['t'] or 0
            collected = branch_repayments.aggregate(
                t=Sum('amount_paid'))['t'] or 0
            overdue_amt = branch_overdue.aggregate(
                t=Sum('principal_amount'))['t'] or 0
            branch_performance.append({
                'branch': branch.name,
                'total_loans': branch_loans.count(),
                'principal_disbursed': float(principal),
                'total_collected': float(collected),
                'overdue_count': branch_overdue.count(),
                'overdue_amount': float(overdue_amt),
                'overdue_rate': round(
                    (float(overdue_amt) / float(principal) * 100)
                    if principal > 0 else 0, 1),
            })

        # --- STAFF PERFORMANCE DATA ---
        
        # --- FIELD OFFICER PERFORMANCE ---
        field_officers = Admins.objects.filter(role='FIELD_OFFICER')
        field_officer_stats = []
        for officer in field_officers:
            loans_submitted = Loans.objects.filter(
                created_by=officer,
                created_at__date__gte=thirty_days_ago
            ).count()
            loans_verified = Loans.objects.filter(
                created_by=officer,
                status__in=['VERIFIED','APPROVED','DISBURSED',
                            'ACTIVE','OVERDUE','CLOSED'],
                updated_at__date__gte=thirty_days_ago
            ).count()
            customers_registered = Users.objects.filter(
                created_by=officer,
                created_at__date__gte=thirty_days_ago
            ).count()
            overdue_count = Loans.objects.filter(
                created_by=officer, status='OVERDUE'
            ).count()
            total_portfolio = Loans.objects.filter(
                created_by=officer,
                status__in=['DISBURSED','ACTIVE','OVERDUE']
            ).aggregate(t=Sum('principal_amount'))['t'] or 0
            field_officer_stats.append({
                'name': officer.full_name,
                'email': officer.email,
                'branch': officer.branch_fk.name
                    if officer.branch_fk else 'N/A',
                'customers_registered': customers_registered,
                'loans_submitted': loans_submitted,
                'loans_verified': loans_verified,
                'overdue_loans': overdue_count,
                'total_portfolio': float(total_portfolio),
                'last_active': 'N/A',
            })

        # --- MANAGER PERFORMANCE ---
        managers = Admins.objects.filter(role='MANAGER')
        manager_stats = []
        for manager in managers:
            branch = manager.branch_fk
            branch_loans = Loans.objects.filter(
                branch=branch) if branch else Loans.objects.none()
            loans_approved = branch_loans.filter(
                status__in=['APPROVED','DISBURSED','ACTIVE',
                            'OVERDUE','CLOSED'],
                updated_at__date__gte=thirty_days_ago
            ).count()
            loans_rejected = Loans.objects.filter(
                status='REJECTED',
                updated_at__date__gte=thirty_days_ago,
                branch=branch
            ).count() if branch else 0
            overdue_in_branch = branch_loans.filter(
                status='OVERDUE').count()
            officers_under = Admins.objects.filter(
                role='FIELD_OFFICER',
                branch_fk=branch
            ).count() if branch else 0
            total_branch_portfolio = branch_loans.filter(
                status__in=['DISBURSED','ACTIVE','OVERDUE']
            ).aggregate(t=Sum('principal_amount'))['t'] or 0
            manager_stats.append({
                'name': manager.full_name,
                'email': manager.email,
                'branch': branch.name if branch else 'N/A',
                'loans_approved': loans_approved,
                'loans_rejected': loans_rejected,
                'overdue_in_branch': overdue_in_branch,
                'field_officers_count': officers_under,
                'branch_portfolio': float(total_branch_portfolio),
                'last_active': 'N/A',
            })

        from django.db.models.functions import Cast
        from django.db.models import FloatField
        # --- FINANCE OFFICER PERFORMANCE ---
        finance_officers = Admins.objects.filter(
            role='FINANCIAL_OFFICER')
        finance_stats = []
        for fo in finance_officers:
            from ..models import AuditLogs
            loans_disbursed = AuditLogs.objects.filter(
                admin=fo,
                action='LOAN_DISBURSED',
                created_at__date__gte=thirty_days_ago
            ).count()
            total_disbursed_amt = AuditLogs.objects.filter(
                admin=fo,
                action='LOAN_DISBURSED',
                created_at__date__gte=thirty_days_ago
            ).annotate(
                amt=Cast(F('new_data__amount'), FloatField())
            ).aggregate(
                t=Sum('amt')
            )['t'] or 0
            unmatched_resolved = AuditLogs.objects.filter(
                admin=fo,
                log_type='MANAGEMENT',
                action__icontains='assigned',
                created_at__date__gte=thirty_days_ago
            ).count()
            finance_stats.append({
                'name': fo.full_name,
                'email': fo.email,
                'loans_disbursed': loans_disbursed,
                'total_disbursed_amount': float(
                    total_disbursed_amt),
                'unmatched_resolved': unmatched_resolved,
                'last_active': 'N/A',
            })

        # --- ADMIN PERFORMANCE ---
        admins_list = Admins.objects.filter(role='ADMIN')
        admin_stats = []
        for admin in admins_list:
            managers_invited = Admins.objects.filter(
                invited_by=admin, role='MANAGER'
            ).count()
            officers_invited = Admins.objects.filter(
                invited_by=admin, role='FIELD_OFFICER'
            ).count()
            admin_stats.append({
                'name': admin.full_name,
                'email': admin.email,
                'managers_invited': managers_invited,
                'officers_invited': officers_invited,
                'last_active': 'N/A',
            })

        # --- STAFF ACTIVITY (last 30 days) - Legacy support ---
        staff_activity = field_officer_stats

        # --- OVERDUE TRACKER ---
        overdue_loans_qs = Loans.objects.filter(
            status='OVERDUE'
        ).select_related(
            'user', 'branch', 'created_by'
        ).order_by('updated_at')

        overdue_tracker = []
        for loan in overdue_loans_qs:
            try:
                days_overdue = (today - loan.updated_at.date()).days
            except (AttributeError, TypeError):
                days_overdue = 0

            last_repayment = Repayments.objects.filter(
                loan=loan
            ).order_by('-payment_date').first()

            overdue_tracker.append({
                'loan_id': str(loan.id) if loan.id else "N/A",
                'customer': loan.user.full_name
                    if loan.user else 'N/A',
                'phone': loan.user.phone
                    if loan.user else 'N/A',
                'branch': loan.branch.name
                    if loan.branch else 'N/A',
                'field_officer': loan.created_by.full_name
                    if loan.created_by else 'N/A',
                'principal': float(loan.principal_amount or 0),
                'days_overdue': days_overdue,
                'last_payment_date': last_repayment.payment_date
                    .strftime('%Y-%m-%d')
                    if (last_repayment and last_repayment.payment_date) else 'Never',
                'last_payment_amount': float(
                    last_repayment.amount_paid or 0)
                    if last_repayment else 0,
            })

        # --- CUSTOMER GROWTH (last 12 months) ---
        customer_growth = (
            Users.objects
            .filter(created_at__date__gte=today-timedelta(days=365))
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        growth_data = [
            {
                'month': g['month'].strftime('%b %Y'),
                'customers': g['count']
            }
            for g in customer_growth
        ]

        # --- COLLECTIONS EFFICIENCY ---
        total_scheduled = RepaymentSchedule.objects.filter(
            due_date__lte=today
        ).aggregate(t=Sum('amount_due'))['t'] or 0
        total_collected = Repayments.objects.aggregate(
            t=Sum('amount_paid'))['t'] or 0
        collection_efficiency = round(
            (float(total_collected) / float(total_scheduled) * 100)
            if total_scheduled > 0 else 0, 1)

        # --- LOAN TURNAROUND TIME ---
        approved_loans = Loans.objects.filter(
            status__in=disbursed_statuses
        ).exclude(disbursed_at=None)
        turnaround_days = []
        for loan in approved_loans[:100]:
            if loan.disbursed_at and loan.created_at:
                days = (loan.disbursed_at.date() -
                        loan.created_at.date()).days
                turnaround_days.append(days)
        avg_turnaround = round(
            sum(turnaround_days) / len(turnaround_days)
            if turnaround_days else 0, 1)

        # --- CASH FLOW PROJECTION (next 30 days) ---
        thirty_days_future = today + timedelta(days=30)
        upcoming_schedules = (
            RepaymentSchedule.objects
            .filter(
                due_date__gte=today,
                due_date__lte=thirty_days_future
            )
            .annotate(day=TruncDate('due_date'))
            .values('day')
            .annotate(expected=Sum('amount_due'))
            .order_by('day')
        )
        cashflow_projection = [
            {
                'date': str(s['day']),
                'expected': float(s['expected'] or 0)
            }
            for s in upcoming_schedules
        ]

        # --- ALERTS ---
        alerts = []
        try:
            capital = SystemCapital.objects.filter(
                name='Simulation Capital').first()
            if capital and float(capital.balance) < 50000:
                alerts.append({
                    'type': 'warning',
                    'message': f'Capital balance is low: '
                        f'KES {float(capital.balance):,.0f}',
                    'category': 'capital'
                })
        except Exception:
            pass

        if len(overdue_tracker) > 0:
            alerts.append({
                'type': 'danger',
                'message': f'{len(overdue_tracker)} overdue '
                    f'loans require attention',
                'category': 'overdue'
            })
        
        try:
            high_overdue = [o for o in overdue_tracker
                            if o.get('days_overdue', 0) > 30]
            if high_overdue:
                alerts.append({
                    'type': 'danger',
                    'message': f'{len(high_overdue)} loans overdue '
                        f'more than 30 days',
                    'category': 'overdue_critical'
                })
        except Exception:
            pass

        return Response({
            'branch_performance': branch_performance,
            'staff_activity': staff_activity,
            'field_officer_stats': field_officer_stats,
            'manager_stats': manager_stats,
            'finance_officer_stats': finance_stats,
            'admin_stats': admin_stats,
            'overdue_tracker': overdue_tracker,
            'customer_growth': growth_data,
            'collection_efficiency': collection_efficiency,
            'avg_turnaround_days': avg_turnaround,
            'cashflow_projection': cashflow_projection,
            'alerts': alerts,
        })
