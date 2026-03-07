DO $$ 
DECLARE
    v_menu_id UUID;
    v_role_id UUID;
BEGIN
    SELECT id INTO v_menu_id FROM "Menu" WHERE name='ตั้งค่าแบรนดิ้ง';
    
    IF v_menu_id IS NULL THEN
        INSERT INTO "Menu" (id, name, path, icon, "sortOrder", "createdAt", "updatedAt") 
        VALUES (gen_random_uuid(), 'ตั้งค่าแบรนดิ้ง', '/dashboard/settings/branding', 'Palette', 12, NOW(), NOW()) 
        RETURNING id INTO v_menu_id;
    END IF;

    FOR v_role_id IN SELECT id FROM "Role" WHERE name IN ('SAAS_ADMIN', 'OWNER') LOOP
        IF NOT EXISTS (SELECT 1 FROM "RoleMenu" WHERE "roleId" = v_role_id AND "menuId" = v_menu_id) THEN
            INSERT INTO "RoleMenu" (id, "roleId", "menuId", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), v_role_id, v_menu_id, NOW(), NOW());
        END IF;
    END LOOP;
END $$;
