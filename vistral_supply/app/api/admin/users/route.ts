import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { config } from "@/lib/config/environment";

type UserRoleRow = { role: string } | null;

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: userRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const userRole = userRoleData as UserRoleRow;
    if (userRole?.role !== "supply_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });

    if (rolesError) {
      console.error("Error loading user roles:", rolesError);
      return NextResponse.json(
        { error: "Error loading users" },
        { status: 500 }
      );
    }

    // Get users with emails using the database function
    const { data: usersData, error: functionError } = await supabase.rpc(
      "get_users_with_roles"
    );

    if (functionError) {
      console.error("Error calling get_users_with_roles:", functionError);
      // Fallback to user_roles if function doesn't exist yet
      const rolesList = (userRoles || []) as { user_id: string; role: string; created_at: string | null }[];
      const users = rolesList.map((ur) => ({
        id: ur.user_id,
        email: `user_${ur.user_id.substring(0, 8)}@example.com`,
        role: ur.role,
        created_at: ur.created_at,
        last_sign_in_at: null,
      }));
      return NextResponse.json({ users });
    }

    const usersList = (usersData ?? []) as { id: string; email?: string; role: string; created_at: string | null; last_sign_in_at: string | null; updated_at: string | null }[];
    const users = usersList.map((u) => ({
      id: u.id,
      email: u.email || `user_${u.id.substring(0, 8)}@example.com`,
      role: u.role,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      updated_at: u.updated_at,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: userRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const userRole = userRoleData as UserRoleRow;
    if (userRole?.role !== "supply_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "email, password, and role are required" },
        { status: 400 }
      );
    }

    // Create user in auth.users using admin API
    // Note: This requires the service role key (not the anon key)
    // We need to use a separate admin client with the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient(
      config.supabase.url,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return NextResponse.json(
        { error: authError.message || "Error creating user" },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Assign role (cast needed for Supabase client generic inference)
    const { error: roleError } = await (supabase.from("user_roles") as any).insert({
      user_id: authData.user.id,
      role: role,
    });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        // Try to delete the user if role assignment fails
        await adminClient.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: "Error assigning role" },
          { status: 500 }
        );
      }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user role
    const { data: userRoleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const userRole = userRoleData as UserRoleRow;
    if (userRole?.role !== "supply_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingRole) {
      // Update existing role (cast needed for Supabase client generic inference)
      const { error } = await (supabase.from("user_roles") as any)
        .update({ role: role, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating role:", error);
        return NextResponse.json(
          { error: "Error updating role" },
          { status: 500 }
        );
      }
    } else {
      // Insert new role (cast needed for Supabase client generic inference)
      const { error } = await (supabase.from("user_roles") as any).insert({
        user_id: userId,
        role: role,
      });

      if (error) {
        console.error("Error creating role:", error);
        return NextResponse.json(
          { error: "Error creating role" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
