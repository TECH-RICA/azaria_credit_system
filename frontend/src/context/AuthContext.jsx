import React, { createContext, useContext, useState, useEffect } from 'react';
import { loanService } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('loan_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    const savedUser = localStorage.getItem("loan_user");
    return savedUser ? JSON.parse(savedUser).role : null;
  });

  const [godModeActing, setGodModeActing] = useState(false);
  const [previewBranchId, setPreviewBranchId] = useState(null);

  useEffect(() => {
    if (user && !activeRole) {
      setActiveRole(user.role);
    }
  }, [user, activeRole]);

  const login = (userData) => {
    // Merge both top-level response AND the admin object to be safe
    const fullData = { ...userData, ...userData.admin };
    
    // Explicitly check for all required flags
    const normalizedUser = {
      ...fullData,
      is_owner: Boolean(fullData.is_owner),
      is_primary_owner: Boolean(fullData.is_primary_owner),
      is_super_admin: Boolean(fullData.is_super_admin),
      god_mode_enabled: Boolean(fullData.god_mode_enabled && fullData.is_owner),
    };

    setUser(normalizedUser);
    setActiveRole(normalizedUser.role);
    localStorage.setItem("loan_user", JSON.stringify(normalizedUser));
  };

  const logout = async () => {
    try {
      await loanService.logout();
    } catch (e) {
      // Continue with local logout regardless
    }
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("loan_user");
    localStorage.removeItem("active_role_view");
    // Clear guide seen flags so next user sees the guide fresh
    [
      "owner",
      "ADMIN",
      "SUPER_ADMIN",
      "MANAGER",
      "FINANCIAL_OFFICER",
      "FIELD_OFFICER",
    ].forEach((role) => {
      localStorage.removeItem(`guide_seen_${role}`);
    });
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem("loan_user", JSON.stringify(newUser));
      return newUser;
    });
  };

  const switchActiveRole = (role, extraData = {}) => {
    setActiveRole(role);
    setGodModeActing(false); // Force preview mode on every role switch
    setPreviewBranchId(extraData.branch_fk || null);
    
    if (extraData.branch_fk) {
      setUser(prev => ({ ...prev, branch_fk: extraData.branch_fk, branch: extraData.branch }));
    }
  };

  const activateActMode = () => setGodModeActing(true);
  const deactivateActMode = () => setGodModeActing(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        activeRole,
        switchActiveRole,
        godModeActing,
        activateActMode,
        deactivateActMode,
        previewBranchId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
