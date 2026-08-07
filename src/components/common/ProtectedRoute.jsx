import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { AccessDenied } from '../../pages/AccessDenied.jsx';

/**
 * ProtectedRoute Component
 * ========================
 * Guards page views based on user permissions.
 * If user does not have view permission for `moduleKey`, displays AccessDenied screen.
 * Forwards layout props (searchQuery, triggerExportModal, triggerImportModal, setToast) down to page children.
 */
export const ProtectedRoute = ({ moduleKey, moduleName, children, ...restProps }) => {
  const { currentUser, hasModulePermission } = useAuth();

  if (!currentUser) return null;

  // If moduleKey is provided, verify view permission
  if (moduleKey && !hasModulePermission(moduleKey, 'view')) {
    return <AccessDenied moduleName={moduleName || moduleKey} />;
  }

  // Forward all layout props (searchQuery, triggerExportModal, triggerImportModal, setToast) to child page
  if (React.isValidElement(children)) {
    return React.cloneElement(children, restProps);
  }

  return children;
};
