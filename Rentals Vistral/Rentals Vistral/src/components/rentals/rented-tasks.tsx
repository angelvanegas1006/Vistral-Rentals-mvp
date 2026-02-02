"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { usePropertyForm } from "./property-form-context";

interface RentedTasksProps {
  property: {
    property_unique_id: string;
    address: string;
    city?: string;
  };
}

export function RentedTasks({ property }: RentedTasksProps) {
  const { formData, updateField } = usePropertyForm();
  const sectionId = "rented";

  // Obtener valor del formulario
  const isVacant = formData[`${sectionId}.isVacant`] || false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Estado de la Vivienda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVacant"
              checked={isVacant}
              onCheckedChange={(checked) =>
                updateField(sectionId, "isVacant", checked === true)
              }
            />
            <Label
              htmlFor="isVacant"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              La vivienda ha pasado a estar vacante
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
