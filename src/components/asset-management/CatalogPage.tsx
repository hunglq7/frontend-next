import EntityManager from "./EntityManager";
import { equipmentCatalogs, type EquipmentCatalogKey } from "./catalogs";

export default function CatalogPage({
  catalog,
}: {
  catalog: EquipmentCatalogKey;
}) {
  const { endpoint, title, fields } = equipmentCatalogs[catalog];
  return <EntityManager endpoint={endpoint} title={title} fields={fields} />;
}
