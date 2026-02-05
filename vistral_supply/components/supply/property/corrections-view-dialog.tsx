"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useAppAuth } from "@/lib/auth/app-auth-context";
import {
  PropertyCorrection,
  CorrectionCategory,
  getPropertyCorrections,
  createPropertyCorrection,
  updatePropertyCorrection,
  deletePropertyCorrection,
  resolveCorrection,
  approveCorrection,
} from "@/lib/supply-corrections-supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CorrectionsViewDialogProps {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCorrectionsChanged?: () => void;
}

const CORRECTION_CATEGORIES: CorrectionCategory[] = [
  "overview",
  "condition",
  "documents",
  "contacts",
  "rental",
];

const CORRECTION_SUBCATEGORIES: Record<CorrectionCategory, string[]> = {
  overview: [
    "Property information",
    "Economic information",
    "Legal and community status",
    "Documentation",
    "Location",
  ],
  condition: ["General condition", "Specific sections"],
  documents: ["Missing documents", "Document quality issues"],
  contacts: ["Seller data", "Tenant data"],
  rental: ["Contract terms", "Payment information", "Insurance information"],
};

function getCategoryKey(category: CorrectionCategory): string {
  return category;
}

function getSubcategoryKey(category: CorrectionCategory, subcategory: string): string {
  const keyMap: Record<string, string> = {
    "Property information": "propertyInformation",
    "Economic information": "economicInformation",
    "Legal and community status": "legalAndCommunityStatus",
    "Documentation": "documentation",
    "Location": "location",
    "General condition": "generalCondition",
    "Specific sections": "specificSections",
    "Missing documents": "missingDocuments",
    "Document quality issues": "documentQualityIssues",
    "Seller data": "sellerData",
    "Tenant data": "tenantData",
    "Contract terms": "contractTerms",
    "Payment information": "paymentInformation",
    "Insurance information": "insuranceInformation",
  };
  return keyMap[subcategory] || subcategory;
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "resolved":
      return "bg-blue-100 text-blue-800";
    case "approved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CorrectionsViewDialog({
  propertyId,
  open,
  onOpenChange,
  onCorrectionsChanged,
}: CorrectionsViewDialogProps) {
  const { t } = useI18n();
  const { user, isAnalyst, isPartner, hasAnyRole } = useAppAuth();
  const [corrections, setCorrections] = useState<PropertyCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [correctionToDelete, setCorrectionToDelete] = useState<string | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState<CorrectionCategory | "">("");
  const [formSubcategory, setFormSubcategory] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const isAnalystOrLead = hasAnyRole(["supply_analyst", "supply_lead", "supply_admin"]);

  // Load corrections
  const loadCorrections = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPropertyCorrections(propertyId);
      setCorrections(data);
    } catch (error) {
      console.error("[CorrectionsViewDialog] Error loading corrections:", error);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    if (open) {
      loadCorrections();
    }
  }, [open, loadCorrections]);

  // Handle create correction
  const handleCreateCorrection = async () => {
    if (!formCategory || !formSubcategory || !formDescription.trim() || !user) return;

    try {
      setIsCreating(true);
      await createPropertyCorrection(
        {
          propertyId,
          category: formCategory,
          subcategory: formSubcategory,
          description: formDescription.trim(),
        },
        user.id
      );

      setFormCategory("");
      setFormSubcategory("");
      setFormDescription("");
      setShowForm(false);
      await loadCorrections();
      onCorrectionsChanged?.();
    } catch (error) {
      console.error("[CorrectionsViewDialog] Error creating correction:", error);
      alert(t.propertyDetail.corrections.errorCreating);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle resolve correction
  const handleResolveCorrection = async (correctionId: string) => {
    if (!user) return;

    try {
      await resolveCorrection(correctionId, user.id);
      await loadCorrections();
      onCorrectionsChanged?.();
    } catch (error) {
      console.error("[CorrectionsViewDialog] Error resolving correction:", error);
      alert(t.propertyDetail.corrections.errorUpdating);
    }
  };

  // Handle approve correction
  const handleApproveCorrection = async (correctionId: string) => {
    if (!user) return;

    try {
      await approveCorrection(correctionId, user.id);
      await loadCorrections();
      onCorrectionsChanged?.();
    } catch (error) {
      console.error("[CorrectionsViewDialog] Error approving correction:", error);
      alert(t.propertyDetail.corrections.errorUpdating);
    }
  };

  // Handle delete correction
  const handleDeleteCorrection = async () => {
    if (!correctionToDelete) return;

    try {
      await deletePropertyCorrection(correctionToDelete);
      setCorrectionToDelete(null);
      setDeleteDialogOpen(false);
      await loadCorrections();
      onCorrectionsChanged?.();
    } catch (error) {
      console.error("[CorrectionsViewDialog] Error deleting correction:", error);
      alert(t.propertyDetail.corrections.errorDeleting);
    }
  };

  // Group corrections by category
  const groupedCorrections = corrections.reduce(
    (acc, correction) => {
      if (!acc[correction.category]) {
        acc[correction.category] = [];
      }
      acc[correction.category].push(correction);
      return acc;
    },
    {} as Record<string, PropertyCorrection[]>
  );

  const availableSubcategories =
    formCategory && CORRECTION_SUBCATEGORIES[formCategory]
      ? CORRECTION_SUBCATEGORIES[formCategory]
      : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.propertyDetail.corrections.title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {/* Create Form */}
            {showForm && isAnalystOrLead && (
              <div className="flex flex-col gap-3 p-4 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
                <Select
                  value={formCategory}
                  onValueChange={(value) => {
                    setFormCategory(value as CorrectionCategory);
                    setFormSubcategory("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.propertyDetail.corrections.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {CORRECTION_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {(t.propertyDetail.corrections.categories as Record<string, string>)[getCategoryKey(cat)]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formCategory && (
                  <Select value={formSubcategory} onValueChange={setFormSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t.propertyDetail.corrections.selectSubcategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map((sub) => {
                        const categoryKey = getCategoryKey(formCategory);
                        const subcategoryKey = getSubcategoryKey(formCategory, sub);
                        const translation =
                          (t.propertyDetail.corrections.subcategories as Record<string, Record<string, string>>)[categoryKey]?.[subcategoryKey] || sub;
                        return (
                          <SelectItem key={sub} value={sub}>
                            {translation}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}

                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t.propertyDetail.corrections.descriptionPlaceholder}
                  rows={3}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateCorrection}
                    disabled={!formCategory || !formSubcategory || !formDescription.trim() || isCreating}
                    className="flex-1"
                    size="sm"
                  >
                    {isCreating ? t.propertyDetail.corrections.saving : t.propertyDetail.corrections.addCorrection}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setFormCategory("");
                      setFormSubcategory("");
                      setFormDescription("");
                    }}
                    size="sm"
                  >
                    {t.common.cancel}
                  </Button>
                </div>
              </div>
            )}

            {/* Header Actions */}
            <div className="flex items-center justify-between">
              {isAnalystOrLead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? t.common.cancel : t.propertyDetail.corrections.addNew}
                </Button>
              )}
            </div>

            {/* Corrections List */}
            {loading ? (
              <div className="text-sm text-[#71717A] py-4">{t.common.loading}</div>
            ) : corrections.length === 0 ? (
              <div className="text-sm text-[#71717A] py-4">{t.propertyDetail.corrections.noCorrections}</div>
            ) : (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedCorrections).map(([category, categoryCorrections]) => (
                  <div key={category} className="flex flex-col gap-3">
                    <h4 className="text-base font-semibold text-[#212121]">
                      {(t.propertyDetail.corrections.categories as Record<string, string>)[getCategoryKey(category as CorrectionCategory)]}
                    </h4>
                    {categoryCorrections.map((correction) => (
                      <div
                        key={correction.id}
                        className="p-4 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7] flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[#71717A] mb-2">
                              {(() => {
                                const categoryKey = getCategoryKey(correction.category);
                                const subcategoryKey = getSubcategoryKey(
                                  correction.category,
                                  correction.subcategory
                                );
                                const subcats = t.propertyDetail.corrections.subcategories as Record<string, Record<string, string>>;
                                return subcats[categoryKey]?.[subcategoryKey] || correction.subcategory;
                              })()}
                            </div>
                            <p className="text-base text-[#212121]">{correction.description}</p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded ${getStatusBadgeColor(correction.status)}`}
                          >
                            {t.propertyDetail.corrections[correction.status]}
                          </span>
                        </div>

                        <div className="text-sm text-[#71717A]">
                          {t.propertyDetail.corrections.createdBy}: {correction.created_by_name || "Unknown"} •{" "}
                          {formatDate(correction.created_at)}
                        </div>

                        {correction.status === "resolved" && correction.resolved_by_name && (
                          <div className="text-sm text-[#71717A]">
                            {t.propertyDetail.corrections.resolvedBy}: {correction.resolved_by_name} •{" "}
                            {formatDate(correction.resolved_at ?? null)}
                          </div>
                        )}

                        {correction.status === "approved" && correction.approved_by_name && (
                          <div className="text-sm text-[#71717A]">
                            {t.propertyDetail.corrections.approvedBy}: {correction.approved_by_name} •{" "}
                            {formatDate(correction.approved_at ?? null)}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-2">
                          {correction.status === "pending" && isPartner && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveCorrection(correction.id)}
                            >
                              {t.propertyDetail.corrections.resolve}
                            </Button>
                          )}
                          {correction.status === "resolved" && isAnalystOrLead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveCorrection(correction.id)}
                            >
                              {t.propertyDetail.corrections.approve}
                            </Button>
                          )}
                          {correction.status === "pending" &&
                            correction.created_by === user?.id &&
                            isAnalystOrLead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCorrectionToDelete(correction.id);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                {t.propertyDetail.corrections.delete}
                              </Button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.propertyDetail.corrections.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.propertyDetail.corrections.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCorrection} className="bg-red-600 hover:bg-red-700">
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
