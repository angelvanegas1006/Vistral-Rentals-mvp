-- ============================================
-- Migración: Actualizar políticas RLS de properties para roles
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;
DROP POLICY IF EXISTS "Service role can manage properties" ON properties;

-- Política 1: Partners solo pueden ver propiedades que crearon
-- Otros roles pueden ver todas las propiedades
CREATE POLICY "Partners can view own properties"
  ON properties
  FOR SELECT
  USING (
    -- Partners solo ven propiedades donde created_by = auth.uid()
    (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'supply_partner'
      )
      AND created_by = auth.uid()
    )
    OR
    -- Otros roles ven todas las propiedades
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_analyst', 'supply_admin', 'supply_lead', 'renovator_analyst', 'reno_lead')
    )
  );

-- Política 2: Partners solo pueden insertar propiedades (y se asigna created_by automáticamente)
CREATE POLICY "Partners can create properties"
  ON properties
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_partner', 'supply_analyst', 'supply_admin', 'supply_lead')
    )
  );

-- Política 3: Partners solo pueden actualizar sus propias propiedades
-- Otros roles pueden actualizar todas las propiedades
CREATE POLICY "Users can update properties based on role"
  ON properties
  FOR UPDATE
  USING (
    -- Partners solo pueden actualizar sus propias propiedades
    (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'supply_partner'
      )
      AND created_by = auth.uid()
    )
    OR
    -- Otros roles pueden actualizar todas las propiedades
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_analyst', 'supply_admin', 'supply_lead', 'renovator_analyst', 'reno_lead')
    )
  )
  WITH CHECK (
    -- Partners solo pueden actualizar sus propias propiedades
    (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() 
        AND role = 'supply_partner'
      )
      AND created_by = auth.uid()
    )
    OR
    -- Otros roles pueden actualizar todas las propiedades
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('supply_analyst', 'supply_admin', 'supply_lead', 'renovator_analyst', 'reno_lead')
    )
  );

-- Política 4: Service role puede gestionar propiedades
CREATE POLICY "Service role can manage properties"
  ON properties
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Función para establecer created_by automáticamente al insertar
CREATE OR REPLACE FUNCTION set_property_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Si created_by no está establecido, usar el usuario actual
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para establecer created_by automáticamente
DROP TRIGGER IF EXISTS trigger_set_property_created_by ON properties;
CREATE TRIGGER trigger_set_property_created_by
  BEFORE INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION set_property_created_by();

-- ============================================
-- ✅ Migración Completada
-- ============================================
