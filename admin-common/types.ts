
export type SubscriptionPlan = 'Basic' | 'Pro' | 'Enterprise';
export type CompanyStatus = 'Active' | 'Suspended' | 'Trial';

export interface Company {
    id: string;
    name: string;
    status: CompanyStatus;
    plan: SubscriptionPlan;
    userCount: number;
    domain: string;
    joinedDate: string;
}

export type TenantUserRole = 'Admin' | 'Editor' | 'Viewer';
export type TenantUserStatus = 'Active' | 'Invited' | 'Deactivated';

export interface TenantUser {
    id: string;
    name: string;
    email: string;
    role: TenantUserRole;
    status: TenantUserStatus;
    avatar: string;
}
