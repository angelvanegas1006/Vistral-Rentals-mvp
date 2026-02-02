"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePropertyRental } from "@/hooks/use-property-rental";
import { cn } from "@/lib/utils";

interface RentalSummaryTabProps {
  propertyId: string;
  currentPhase?: string;
}

export function RentalSummaryTab({ propertyId, currentPhase }: RentalSummaryTabProps) {
  const { rental, loading, updateRental } = usePropertyRental({ propertyId });
  
  // Local state for form fields
  const [rentPrice, setRentPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [legalContract, setLegalContract] = useState("");

  // Initialize form from rental data
  useEffect(() => {
    if (rental) {
      setRentPrice(rental.rent_price?.toString() || "");
      setStartDate(rental.start_date || "");
      setDuration(rental.duration || "");
      setSecurityDeposit(rental.security_deposit?.toString() || "");
      setLegalContract(rental.legal_contract_url || "");
    }
  }, [rental]);

  const handleFieldChange = async (field: string, value: string) => {
    // Update local state immediately for responsive UI
    switch (field) {
      case "rentPrice":
        setRentPrice(value);
        break;
      case "startDate":
        setStartDate(value);
        break;
      case "duration":
        setDuration(value);
        break;
      case "securityDeposit":
        setSecurityDeposit(value);
        break;
      case "legalContract":
        setLegalContract(value);
        break;
    }

    // Update in database
    try {
      await updateRental({
        rent_price: field === "rentPrice" ? parseFloat(value) || null : parseFloat(rentPrice) || null,
        start_date: field === "startDate" ? value : startDate,
        duration: field === "duration" ? value : duration,
        security_deposit: field === "securityDeposit" ? parseFloat(value) || null : parseFloat(securityDeposit) || null,
        legal_contract_url: field === "legalContract" ? value : legalContract,
      });
    } catch (error) {
      console.error("Error updating rental:", error);
      // Revert local state on error
      if (rental) {
        setRentPrice(rental.rent_price?.toString() || "");
        setStartDate(rental.start_date || "");
        setDuration(rental.duration || "");
        setSecurityDeposit(rental.security_deposit?.toString() || "");
        setLegalContract(rental.legal_contract_url || "");
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="bg-card rounded-lg border p-6 shadow-sm">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-semibold mb-0">Alquiler</CardTitle>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rental-rentPrice" className="text-sm font-medium">
              Precio de alquiler (€)
            </Label>
            <Input
              id="rental-rentPrice"
              type="number"
              placeholder="Ej: 1200"
              value={rentPrice}
              onChange={(e) => handleFieldChange("rentPrice", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-startDate" className="text-sm font-medium">
              Fecha de inicio
            </Label>
            <Input
              id="rental-startDate"
              type="date"
              value={startDate}
              onChange={(e) => handleFieldChange("startDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-duration" className="text-sm font-medium">
              Duración del contrato
            </Label>
            <Input
              id="rental-duration"
              type="text"
              placeholder="Ej: 12 meses, 24 meses, etc."
              value={duration}
              onChange={(e) => handleFieldChange("duration", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-securityDeposit" className="text-sm font-medium">
              Fianza / Depósito de seguridad (€)
            </Label>
            <Input
              id="rental-securityDeposit"
              type="number"
              placeholder="Ej: 2400"
              value={securityDeposit}
              onChange={(e) => handleFieldChange("securityDeposit", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Generalmente equivale a 1-2 meses de alquiler
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-legalContract" className="text-sm font-medium">
              Contrato legal
            </Label>
            <Input
              id="rental-legalContract"
              type="text"
              placeholder="URL del contrato en Storage"
              value={legalContract}
              onChange={(e) => handleFieldChange("legalContract", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Referencia del contrato firmado o enlace al documento
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
