import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { locations } from "../../db/schema";

export const LocationSchema = createSelectSchema(locations);
export type Location = z.infer<typeof LocationSchema>;

export const SetLocationFeatureFlagsInputSchema = z
  .object({
    locationId: z.uuid(),
    selfCheckInEnabled: z.boolean().nullish(),
    managerMarkingEnabled: z.boolean().nullish(),
  })
  .refine((v) => v.selfCheckInEnabled != null || v.managerMarkingEnabled != null, {
    message: "Provide at least one flag to change",
  });
export type SetLocationFeatureFlagsInput = z.infer<typeof SetLocationFeatureFlagsInputSchema>;
