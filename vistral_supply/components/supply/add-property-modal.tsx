"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddPropertyForm } from "./add-property-form";
import { useI18n } from "@/lib/i18n";

interface AddPropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string | null;
}

export function AddPropertyModal({ open, onOpenChange, propertyId }: AddPropertyModalProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] max-h-[90vh] overflow-y-auto mx-auto rounded-lg p-6 gap-6 bg-white dark:bg-[#1a1a1a] border border-[#E4E4E7] shadow-[0px_0px_24px_rgba(0,0,0,0.16)]">
        <DialogHeader className="p-0 border-0">
          <DialogTitle className="text-[24px] leading-[32px] font-medium tracking-[-1.5px] text-[#212121] dark:text-white">
            {propertyId ? t.property.edit : t.property.addNew}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {propertyId 
              ? "Edita los datos de la propiedad" 
              : "Completa el formulario para agregar una nueva propiedad"}
          </DialogDescription>
        </DialogHeader>
        <div className="p-0">
          <AddPropertyForm
            propertyId={propertyId || undefined}
            onSuccess={(propertyId) => {
              console.log("Property saved:", propertyId);
              onOpenChange(false);
              // Redirect to property edit page
              router.push(`/supply/property/${propertyId}/edit`);
            }}
            showTitle={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
