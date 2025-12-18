import { useOrganization, useUser } from '@clerk/nextjs';

export function useOrganizationContext() {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (!isUserLoaded || !isOrgLoaded) {
    return { isLoading: true, organizationId: null, userId: null };
  }

  if (!user) {
    return { isLoading: false, organizationId: null, userId: null };
  }

  // For multi-tenant SaaS, we need an organization
  if (!organization) {
    return {
      isLoading: false,
      organizationId: null,
      userId: user.id,
      error: 'No organization selected'
    };
  }

  return {
    isLoading: false,
    organizationId: organization.id,
    userId: user.id,
    organizationName: organization.name,
    userEmail: user.primaryEmailAddress?.emailAddress,
  };
}