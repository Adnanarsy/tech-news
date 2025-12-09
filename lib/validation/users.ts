import { z } from "zod";

export const RoleSchema = z.enum(["reader", "trainer", "admin"], {
  required_error: "role is required",
});

export const UserRoleUpdateSchema = z.object({
  role: RoleSchema,
});

export type UserRoleUpdateInput = z.infer<typeof UserRoleUpdateSchema>;
