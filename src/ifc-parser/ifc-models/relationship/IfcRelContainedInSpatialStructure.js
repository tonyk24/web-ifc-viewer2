import { ifcClass } from "../../utils/globalProperties.js";
import { ifcDataTypes as d } from "../../utils/ifc-data-types.js";
import { getName, ifcTypes as t } from "../../utils/ifc-types.js";

const IfcRelContainedInSpatialStructure = {
  [ifcClass]: getName(t.IfcRelContainedInSpatialStructure),
  Guid: d.guid,
  OwnerHistory: d.id,
  Name: d.text,
  Description: d.text,
  RelatedElements: d.idSet,
  RelatingStructure: d.id,
};

export { IfcRelContainedInSpatialStructure };