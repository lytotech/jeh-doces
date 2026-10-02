import { Material, OrderMaterialItem, OrderProductItem, Product } from '../types';

export type EditableOrderMaterial = OrderMaterialItem & {
  source: 'automatic' | 'manual' | 'legacy';
};

export const parseNonNegativeQuantity = (value: unknown): number => {
  const parsed =
    typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const getAutomaticQuantities = (items: OrderProductItem[], products: Product[]) => {
  const quantities = new Map<string, number>();
  items.forEach((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    product?.materials.forEach((productMaterial) => {
      quantities.set(
        productMaterial.materialId,
        (quantities.get(productMaterial.materialId) || 0) +
          productMaterial.quantity * parseNonNegativeQuantity(item.quantity),
      );
    });
  });
  return quantities;
};

export const inferOrderMaterials = (
  items: OrderProductItem[],
  materialsInOrder: OrderMaterialItem[],
  products: Product[],
): EditableOrderMaterial[] => {
  const automaticByMaterial = getAutomaticQuantities(items, products);
  const remainingAutomatic = new Map(automaticByMaterial);
  const inferred: EditableOrderMaterial[] = [];

  materialsInOrder.forEach((material) => {
    if (material.isAutomatic !== undefined || material.id.startsWith('auto-')) {
      inferred.push({
        ...material,
        source: material.isAutomatic === false ? 'manual' : 'automatic',
      });
      return;
    }

    const automaticQuantity = Math.min(
      parseNonNegativeQuantity(material.quantity),
      remainingAutomatic.get(material.materialId) || 0,
    );
    if (automaticQuantity > 0) {
      inferred.push({
        ...material,
        id: `auto-${material.materialId}`,
        quantity: automaticQuantity,
        totalCost: automaticQuantity * material.unitCost,
        isAutomatic: true,
        source: 'automatic',
      });
      remainingAutomatic.set(
        material.materialId,
        (remainingAutomatic.get(material.materialId) || 0) - automaticQuantity,
      );
    }

    const manualQuantity = parseNonNegativeQuantity(material.quantity) - automaticQuantity;
    if (manualQuantity > 0) {
      inferred.push({
        ...material,
        quantity: manualQuantity,
        totalCost: manualQuantity * material.unitCost,
        isAutomatic: false,
        source: 'manual',
      });
    }
  });

  return inferred;
};

export const syncOrderMaterials = (
  nextItems: OrderProductItem[],
  currentMaterials: EditableOrderMaterial[],
  products: Product[],
  materials: Material[],
): EditableOrderMaterial[] => {
  const automaticByMaterial = getAutomaticQuantities(nextItems, products);
  const remainingAutomatic = new Map(automaticByMaterial);
  const manualMaterials = new Map<string, EditableOrderMaterial>();
  const automaticMaterials = new Map<string, EditableOrderMaterial>();

  const addManualMaterial = (material: EditableOrderMaterial, quantity: number) => {
    if (quantity <= 0) return;
    const existing = manualMaterials.get(material.materialId);
    if (existing) {
      existing.quantity += quantity;
      existing.totalCost += material.totalCost;
      return;
    }
    manualMaterials.set(material.materialId, {
      ...material,
      quantity,
      totalCost: material.totalCost,
      isAutomatic: false,
      source: 'manual',
    });
  };

  const addAutomaticMaterial = (material: EditableOrderMaterial, quantity: number) => {
    if (quantity <= 0) return;
    const existing = automaticMaterials.get(material.materialId);
    if (existing) {
      existing.quantity += quantity;
      existing.totalCost = existing.quantity * existing.unitCost;
      return;
    }
    automaticMaterials.set(material.materialId, {
      ...material,
      id: `auto-${material.materialId}`,
      quantity,
      totalCost: quantity * material.unitCost,
      isAutomatic: true,
      source: 'automatic',
    });
  };

  currentMaterials.forEach((material) => {
    if (material.source === 'manual') {
      addManualMaterial(material, parseNonNegativeQuantity(material.quantity));
      return;
    }

    const remaining = remainingAutomatic.get(material.materialId) || 0;
    const automaticQuantity = Math.min(parseNonNegativeQuantity(material.quantity), remaining);
    addAutomaticMaterial(material, automaticQuantity);
    remainingAutomatic.set(material.materialId, remaining - automaticQuantity);

    const manualQuantity = parseNonNegativeQuantity(material.quantity) - automaticQuantity;
    if (material.source === 'legacy' && manualQuantity > 0) {
      addManualMaterial(
        {
          ...material,
          quantity: manualQuantity,
          totalCost: manualQuantity * material.unitCost,
          isAutomatic: false,
          source: 'manual',
        },
        manualQuantity,
      );
    }
  });

  automaticByMaterial.forEach((_quantity, materialId) => {
    const material = materials.find((candidate) => candidate.id === materialId);
    const quantityToAdd = remainingAutomatic.get(materialId) || 0;
    if (!material || quantityToAdd <= 0) return;

    addAutomaticMaterial(
      {
        id: `auto-${material.id}`,
        materialId: material.id,
        materialName: material.name,
        quantity: quantityToAdd,
        unitCost: material.unitCost,
        totalCost: quantityToAdd * material.unitCost,
        isAutomatic: true,
        source: 'automatic',
      },
      quantityToAdd,
    );
  });

  return [...manualMaterials.values(), ...automaticMaterials.values()];
};
