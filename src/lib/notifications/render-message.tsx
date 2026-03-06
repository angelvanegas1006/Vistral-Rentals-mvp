import React from "react";

/**
 * Parses a notification message string that may contain **bold** markdown
 * and returns React elements with proper <strong> formatting.
 */
export function renderNotificationMessage(message: string): React.ReactNode {
  const parts = message.split(/(\*\*[^*]+\*\*)/g);

  if (parts.length === 1) return message;

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Solid, readable background classes for notification cards.
 * Overrides the default Alert variant's subtle 10%-opacity background
 * with a proper colored card: strong bg, colored border, dark readable text.
 */
const NOTIFICATION_CARD_STYLES: Record<string, string> = {
  urgent_visit_cancel: [
    "bg-red-50 border-red-300 text-red-900",
    "[&>svg]:text-red-600",
    "dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    "dark:[&>svg]:text-red-400",
  ].join(" "),
  auto_recovery: [
    "bg-amber-50 border-amber-300 text-amber-900",
    "[&>svg]:text-amber-600",
    "dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
    "dark:[&>svg]:text-amber-400",
  ].join(" "),
  phase_auto_move: [
    "bg-amber-50 border-amber-300 text-amber-900",
    "[&>svg]:text-amber-600",
    "dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
    "dark:[&>svg]:text-amber-400",
  ].join(" "),
  info_property_unavailable: [
    "bg-amber-50 border-amber-300 text-amber-900",
    "[&>svg]:text-amber-600",
    "dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100",
    "dark:[&>svg]:text-amber-400",
  ].join(" "),
  recovery: [
    "bg-blue-50 border-blue-300 text-blue-900",
    "[&>svg]:text-blue-600",
    "dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
    "dark:[&>svg]:text-blue-400",
  ].join(" "),
};

export function getNotificationCardClassName(notificationType: string): string {
  return NOTIFICATION_CARD_STYLES[notificationType] ?? "";
}
