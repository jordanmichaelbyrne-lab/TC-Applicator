import { getCurrentUserAndCompany } from "@/app/lib/repositories/tenant";
import { getCompanySettings } from "@/app/lib/settings/companySettings";
import CoatingDefaultsForm from "./CoatingDefaultsForm";

export default async function CoatingDefaultsPage() {
  const { isAdmin } = await getCurrentUserAndCompany();

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <h1 className="text-xl font-semibold mb-2">Coating Defaults</h1>
        <p className="text-gray-500">
          Only company admins can view and edit these settings.
        </p>
      </div>
    );
  }

  const settings = await getCompanySettings();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-xl font-semibold mb-1">Coating Defaults</h1>
      <p className="text-gray-500 mb-8">
        These values are used as the starting defaults for new estimates.
        Changing them here does not affect estimates already created.
      </p>

      <CoatingDefaultsForm initialSettings={settings} />
    </div>
  );
}