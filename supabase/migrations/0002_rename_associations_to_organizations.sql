-- rename associations table to organizations
alter table associations rename to organizations;

-- rename association_id column on pins
alter table pins rename column association_id to organization_id;

-- update role check constraint on profiles
alter table profiles drop constraint profiles_role_check;
alter table profiles add constraint profiles_role_check
    check (role in ('user', 'org_admin', 'superadmin'));
