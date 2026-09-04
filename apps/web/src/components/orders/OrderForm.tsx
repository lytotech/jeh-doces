import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderProductItem, OrderMaterialItem, OrderStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AppHeader } from '../layout/AppHeader';
import { TextInput } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { DateTimePicker } from '../ui/DateTimePicker';
import { maskPhone } from '../../services/formatters';
import { formatCurrency, formatDecimal, ORDER_STATUS_MAP } from '../../services/costEngine';
import { Plus, UserPlus, Search, Trash2, Cookie, Package, User } from 'lucide-react';

interface OrderFormProps {
  order?: Order | null;
  onBack: () => void;
  onSaved: (orderId: string) => void;
}

type EditableOrderMaterial = OrderMaterialItem & {
  source: 'automatic' | 'manual';
};

type CatalogOption = {
  id: string;
  name: string;
  detail: string;
};

const CatalogPicker: React.FC<{
  value: string;
  options: CatalogOption[];
  placeholder: string;
  onChange: (id: string) => void;
}> = ({ value, options, placeholder, onChange }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value);
  const [query, setQuery] = useState(selected?.name || '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) setQuery(selected?.name || '');
  }, [selected?.name, open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredOptions = options.filter((option) =>
    `${option.name} ${option.detail}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div ref={wrapperRef} className="relative min-w-0 flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A89484]" />
        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          className="w-full rounded-xl border border-[#DFCFC0] bg-white py-1.5 pl-8 pr-2.5 text-xs font-semibold text-[#302116] focus:outline-none"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E5DACD] bg-white shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setQuery(option.name);
                  setOpen(false);
                }}
                className="block w-full border-b border-[#F4EFEA] px-3 py-2 text-left last:border-0 hover:bg-[#F7E5EA]"
              >
                <span className="block truncate text-xs font-semibold text-[#302116]">
                  {option.name}
                </span>
                <span className="block truncate text-[10px] text-[#7A6453]">{option.detail}</span>
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-[#8A7565]">Nenhum item encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const OrderForm: React.FC<OrderFormProps> = ({ order, onBack, onSaved }) => {
  const { products, materials, customers, saveOrderAction, deleteOrderAction, saveCustomerAction } =
    useApp();

  const isEditing = !!order?.id;

  const [clientName, setClientName] = useState(order?.clientName || '');
  const [clientPhone, setClientPhone] = useState(maskPhone(order?.clientPhone || ''));
  const [clientAddress, setClientAddress] = useState(order?.clientAddress || '');
  const [customerId, setCustomerId] = useState(order?.customerId || '');
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const isCustomerLinked = Boolean(customerId && selectedCustomer);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState<typeof customers>([]);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const customerPickerRef = useRef<HTMLDivElement>(null);
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerPhone, setQuickCustomerPhone] = useState('');
  const [quickCustomerAddress, setQuickCustomerAddress] = useState('');

  // Keep the order snapshot in sync when the selected customer is edited elsewhere.
  useEffect(() => {
    if (!customerId) return;
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;
    setClientName(customer.name);
    setCustomerSearch(customer.name);
    setClientPhone(maskPhone(customer.phone || ''));
    setClientAddress(customer.address || '');
  }, [customerId, customers]);

  useEffect(() => {
    if (!customerPickerOpen) return;
    const timer = window.setTimeout(() => {
      void api
        .getCustomers(false, customerSearch)
        .then(setCustomerSuggestions)
        .catch(() => setCustomerSuggestions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [customerSearch, customerPickerOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (customerPickerRef.current && !customerPickerRef.current.contains(event.target as Node)) {
        setCustomerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);
  const [deliveryDate, setDeliveryDate] = useState(
    order?.deliveryDate
      ? order.deliveryDate.slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  );
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'orcamento');
  const [discount, setDiscount] = useState(order ? order.discount.toString() : '0');
  const [notes, setNotes] = useState(order?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [items, setItems] = useState<OrderProductItem[]>(order?.items || []);
  // Older orders do not persist the origin of a material. Treat their rows as
  // manual so editing an existing order never silently removes user data.
  const [orderMaterials, setOrderMaterials] = useState<EditableOrderMaterial[]>(
    (order?.materials || []).map((material) => ({ ...material, source: 'manual' })),
  );

  const syncAutomaticMaterials = (
    nextItems: OrderProductItem[],
    currentMaterials: EditableOrderMaterial[],
  ): EditableOrderMaterial[] => {
    const automaticByMaterial = new Map<string, number>();

    nextItems.forEach((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      product?.materials.forEach((productMaterial) => {
        automaticByMaterial.set(
          productMaterial.materialId,
          (automaticByMaterial.get(productMaterial.materialId) || 0) +
            productMaterial.quantity * item.quantity,
        );
      });
    });

    const manualMaterials = currentMaterials.filter((material) => material.source === 'manual');
    const automaticMaterials: EditableOrderMaterial[] = [];

    automaticByMaterial.forEach((quantity, materialId) => {
      const material = materials.find((candidate) => candidate.id === materialId);
      if (!material || quantity <= 0) return;

      automaticMaterials.push({
        id: `auto-${material.id}`,
        materialId: material.id,
        materialName: material.name,
        quantity,
        unitCost: material.unitCost,
        totalCost: quantity * material.unitCost,
        source: 'automatic',
      });
    });

    return [...manualMaterials, ...automaticMaterials];
  };

  // Add Product Item
  const handleAddProduct = () => {
    if (products.length === 0) return;
    const p = products[0];
    const newItem: OrderProductItem = {
      id: `item-${Date.now()}`,
      productId: p.id,
      productName: p.name,
      quantity: 1,
      unitPrice: p.salePrice,
      totalPrice: p.salePrice,
      unitCost: p.calculatedCost,
      totalCost: p.calculatedCost,
    };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    setOrderMaterials(syncAutomaticMaterials(nextItems, orderMaterials));
  };

  const handleUpdateProduct = (
    index: number,
    field: 'productId' | 'quantity' | 'unitPrice',
    val: any,
  ) => {
    const updated = [...items];
    const current = updated[index];

    if (field === 'productId') {
      const p = products.find((prod) => prod.id === val);
      if (p) {
        current.productId = p.id;
        current.productName = p.name;
        current.unitPrice = p.salePrice;
        current.unitCost = p.calculatedCost;
        current.totalPrice = current.quantity * p.salePrice;
        current.totalCost = current.quantity * p.calculatedCost;
      }
    } else if (field === 'quantity') {
      const qty = parseFloat(String(val).replace(',', '.')) || 0;
      current.quantity = qty;
      current.totalPrice = qty * current.unitPrice;
      current.totalCost = qty * current.unitCost;
    } else if (field === 'unitPrice') {
      const price = parseFloat(String(val).replace(',', '.')) || 0;
      current.unitPrice = price;
      current.totalPrice = current.quantity * price;
    }

    setItems(updated);
    setOrderMaterials(syncAutomaticMaterials(updated, orderMaterials));
  };

  const handleRemoveProduct = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setOrderMaterials(syncAutomaticMaterials(updated, orderMaterials));
  };

  // Add Material Item
  const handleAddMaterial = () => {
    if (materials.length === 0) return;
    const m = materials[0];
    const newMat: EditableOrderMaterial = {
      id: `ord-mat-${Date.now()}`,
      materialId: m.id,
      materialName: m.name,
      quantity: 1,
      unitCost: m.unitCost,
      totalCost: m.unitCost,
      source: 'manual',
    };
    setOrderMaterials([...orderMaterials, newMat]);
  };

  const handleUpdateMaterial = (
    index: number,
    field: 'materialId' | 'quantity' | 'unitCost',
    val: any,
  ) => {
    const updated = [...orderMaterials];
    const current = updated[index];

    if (field === 'materialId') {
      const m = materials.find((mat) => mat.id === val);
      if (m) {
        current.materialId = m.id;
        current.materialName = m.name;
        current.unitCost = m.unitCost;
        current.totalCost = current.quantity * m.unitCost;
      }
    } else if (field === 'quantity') {
      const qty = parseFloat(String(val).replace(',', '.')) || 0;
      current.quantity = qty;
      current.totalCost = qty * current.unitCost;
    } else if (field === 'unitCost') {
      const cost = parseFloat(String(val).replace(',', '.')) || 0;
      current.unitCost = cost;
      current.totalCost = current.quantity * cost;
    }

    setOrderMaterials(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    setOrderMaterials(orderMaterials.filter((_, i) => i !== index));
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  const numDiscount = parseFloat(discount.replace(',', '.')) || 0;
  const totalCharged = Math.max(0, subtotal - numDiscount);

  const estimatedCost = useMemo(() => {
    const prodCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const matCost = orderMaterials.reduce((sum, mat) => sum + mat.totalCost, 0);
    return prodCost + matCost;
  }, [items, orderMaterials]);

  const estimatedProfit = totalCharged - estimatedCost;
  const profitMarginPercent = totalCharged > 0 ? (estimatedProfit / totalCharged) * 100 : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || saving) return;
    setSaving(true);

    try {
      if (isCustomerLinked && selectedCustomer) {
        const updatedCustomer = await saveCustomerAction({
          id: selectedCustomer.id,
          name: clientName.trim(),
          phone: clientPhone.trim() || undefined,
          address: clientAddress.trim() || undefined,
        });

        if (!updatedCustomer) return;
      }

      const savedId = await saveOrderAction({
        id: order?.id,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientAddress: clientAddress.trim() || undefined,
        customerId: customerId || undefined,
        deliveryDate: new Date(deliveryDate).toISOString(),
        status,
        items,
        materials: orderMaterials.map(({ source: _, ...material }) => material),
        subtotal,
        discount: numDiscount,
        totalCharged,
        estimatedCost,
        estimatedProfit,
        profitMarginPercent,
        notes: notes.trim() || undefined,
      });

      onSaved(savedId);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (order?.id) {
      deleteOrderAction(order.id);
      setShowDeleteConfirm(false);
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <AppHeader
        title={isEditing ? 'Editar encomenda' : 'Nova encomenda'}
        showBack
        onBack={onBack}
        rightAction={
          isEditing && (
            <button
              onClick={handleDelete}
              className="p-2 text-white/80 hover:text-white hover:bg-rose-600/30 rounded-full transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )
        }
      />

      <div className="max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="rounded-[2rem] border-0 p-4 shadow-sm sm:p-6 lg:p-7">
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Column (col-span-7): Customer & Items Form */}
            <div className="lg:col-span-7 space-y-4">
              {/* Dados do Cliente */}
              <div className="p-5 bg-white rounded-3xl border border-[#E5DACD] space-y-3 shadow-xs">
                <h3 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:[&>div:first-child]:col-span-2">
                  <div ref={customerPickerRef} className="relative">
                    <label className="block text-xs font-medium text-[#7A6453] mb-1">
                      Selecionar cliente cadastrado
                    </label>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89484]" />
                        <input
                          className="w-full min-w-0 pl-9 pr-3 py-3 bg-[#FCFAF8] border border-[#E5DACD] rounded-2xl text-xs font-semibold text-[#302116]"
                          value={customerSearch}
                          placeholder="Buscar por nome..."
                          onFocus={() => {
                            setCustomerPickerOpen(true);
                            setCustomerSearch(
                              customerId
                                ? customers.find((c) => c.id === customerId)?.name || ''
                                : '',
                            );
                          }}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setCustomerId('');
                            setClientName('');
                            setClientPhone('');
                            setClientAddress('');
                            setCustomerPickerOpen(true);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQuickCustomer(true)}
                        className="px-3 rounded-2xl border border-[#DFCFC0] text-[#96642F] text-xs font-semibold whitespace-nowrap"
                        title="Cadastrar novo cliente"
                      >
                        <UserPlus className="w-4 h-4 inline mr-1" />
                        Novo
                      </button>
                    </div>
                    {customerPickerOpen && customerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 bg-white border border-[#E5DACD] rounded-2xl shadow-lg overflow-hidden">
                        {customerSuggestions.map((c) => (
                          <button
                            type="button"
                            key={c.id}
                            className="w-full text-left px-3 py-2.5 hover:bg-[#F5ECE0] border-b border-[#F4EFEA]"
                            onClick={() => {
                              setCustomerId(c.id);
                              setCustomerSearch(c.name);
                              setClientName(c.name);
                              setClientPhone(maskPhone(c.phone || ''));
                              setClientAddress(c.address || '');
                              setCustomerPickerOpen(false);
                            }}
                          >
                            <span className="block text-xs font-semibold text-[#302116]">
                              {c.name}
                            </span>
                            <span className="block text-[11px] text-[#7A6453]">
                              {c.phone || c.email || 'Sem contato'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {(customerId || isEditing) && (
                    <>
                      <TextInput
                        label={isCustomerLinked ? 'Nome do cliente (cadastro)' : 'Nome do cliente'}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Diego banco"
                        required
                        autoFocus
                        helpText={
                          isCustomerLinked
                            ? 'Edite para atualizar o cadastro e esta encomenda.'
                            : undefined
                        }
                      />

                      <TextInput
                        label="Telefone / WhatsApp"
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(maskPhone(e.target.value))}
                        placeholder="(11) 98765-4321"
                      />
                    </>
                  )}
                </div>

                <Modal
                  isOpen={showQuickCustomer}
                  onClose={() => setShowQuickCustomer(false)}
                  title="Novo cliente"
                  subtitle="Cadastre e selecione na encomenda"
                >
                  <div className="space-y-3">
                    <TextInput
                      label="Nome"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      autoFocus
                      required
                    />
                    <TextInput
                      label="Telefone / WhatsApp"
                      type="tel"
                      value={quickCustomerPhone}
                      onChange={(e) => setQuickCustomerPhone(maskPhone(e.target.value))}
                    />
                    <TextInput
                      label="Endereço"
                      value={quickCustomerAddress}
                      onChange={(e) => setQuickCustomerAddress(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowQuickCustomer(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!quickCustomerName.trim()) return;
                          const c = await saveCustomerAction({
                            name: quickCustomerName,
                            phone: quickCustomerPhone,
                            address: quickCustomerAddress,
                          });
                          if (c) {
                            setCustomerId(c.id);
                            setCustomerSearch(c.name);
                            setClientName(c.name);
                            setClientPhone(c.phone || '');
                            setClientAddress(c.address || '');
                            setQuickCustomerName('');
                            setQuickCustomerPhone('');
                            setQuickCustomerAddress('');
                            setShowQuickCustomer(false);
                          }
                        }}
                      >
                        Cadastrar cliente
                      </Button>
                    </div>
                  </div>
                </Modal>

                {(customerId || isEditing) && (
                  <TextInput
                    label="Endereço de entrega"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    placeholder="Ex: Av. Paulista, 1000 - Apto 42"
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DateTimePicker
                    label="Data e hora da entrega"
                    value={deliveryDate}
                    onChange={setDeliveryDate}
                    required
                  />

                  <div>
                    <label className="block text-xs font-medium text-[#7A6453] mb-1">
                      Status Inicial
                    </label>
                    <select
                      className="w-full px-3 py-3 bg-[#FCFAF8] border border-[#E5DACD] focus:border-[#96642F] rounded-2xl text-xs font-bold text-[#302116]"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as OrderStatus)}
                    >
                      {Object.entries(ORDER_STATUS_MAP).map(([key, val]) => (
                        <option key={key} value={key}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Produtos do Pedido */}
              <div className="p-5 bg-white rounded-3xl border border-[#E5DACD] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5">
                    <Cookie className="w-3.5 h-3.5" /> Doces & Produtos
                  </h3>
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddProduct}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar Doce
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-center py-4 text-[#8A7565]">
                    Nenhum doce adicionado. Clique no botão acima para incluir produtos.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <CatalogPicker
                            value={item.productId}
                            placeholder="Buscar doce ou produto..."
                            options={products.map((p) => ({
                              id: p.id,
                              name: p.name,
                              detail: formatCurrency(p.salePrice),
                            }))}
                            onChange={(id) => handleUpdateProduct(index, 'productId', id)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="p-1 text-[#A89484] hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-[#7A6453] uppercase block">Qtd</span>
                            <input
                              type="number"
                              step="any"
                              className="w-full px-2 py-1 bg-white border border-[#DFCFC0] rounded-lg font-bold text-center"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateProduct(index, 'quantity', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7A6453] uppercase block">
                              Preço Un (R$)
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-2 py-1 bg-white border border-[#DFCFC0] rounded-lg font-bold text-center"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateProduct(index, 'unitPrice', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#7A6453] uppercase block">
                              Total
                            </span>
                            <span className="block pt-1 text-sm font-bold text-[#96642F] text-right">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Materiais e Embalagens */}
              <div className="p-5 bg-white rounded-3xl border border-[#E5DACD] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase font-bold text-[#7A4B1D] tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Materiais & Embalagens
                  </h3>
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddMaterial}>
                    <Plus className="w-3.5 h-3.5" /> Adicionar Material
                  </Button>
                </div>

                {orderMaterials.length === 0 ? (
                  <p className="text-xs text-center py-3 text-[#8A7565]">
                    Nenhuma embalagem extra adicionada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderMaterials.map((mat, index) => (
                      <div
                        key={mat.id || index}
                        className="p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] flex items-center gap-2"
                      >
                        <CatalogPicker
                          value={mat.materialId}
                          placeholder="Buscar material ou embalagem..."
                          options={materials.map((m) => ({
                            id: m.id,
                            name: m.name,
                            detail: `Custo: ${formatCurrency(m.unitCost)}`,
                          }))}
                          onChange={(id) => handleUpdateMaterial(index, 'materialId', id)}
                        />

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            className="w-14 px-1.5 py-1 text-xs font-bold text-center bg-white border border-[#DFCFC0] rounded-lg"
                            value={mat.quantity}
                            onChange={(e) =>
                              handleUpdateMaterial(index, 'quantity', e.target.value)
                            }
                          />
                          <span className="text-[11px] text-[#7A6453]">un</span>
                        </div>

                        <span className="text-xs font-bold text-[#7A6453] w-14 text-right">
                          {formatCurrency(mat.totalCost)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(index)}
                          className="p-1 text-[#A89484] hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (col-span-5): Financial Summary & Actions */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-[#F2ECE1] rounded-3xl border border-[#DFCFC0] shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-[#302116] pb-1 border-b border-[#E5DACD]">
                  Cálculo Financeiro
                </h3>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7A6453]">Subtotal dos Itens:</span>
                  <span className="font-semibold text-[#302116]">{formatCurrency(subtotal)}</span>
                </div>

                <TextInput
                  label="Desconto Aplicado (R$)"
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0,00"
                />

                <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-[#E5DACD]">
                  <span>Total a Cobrar:</span>
                  <span className="text-[#302116] text-xl">{formatCurrency(totalCharged)}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-[#7A6453] pt-1">
                  <span>Custo dos insumos e embalagens:</span>
                  <span>{formatCurrency(estimatedCost)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-[#4A280F] pt-2 border-t border-[#E5DACD]">
                  <span>Lucro Previsto:</span>
                  <span className="text-[#96642F] text-lg">
                    {formatCurrency(estimatedProfit)} ({formatDecimal(profitMarginPercent, 1)}%)
                  </span>
                </div>
              </div>

              <TextInput
                label="Observações do Pedido"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Entregar na portaria, cartão personalizado..."
              />

              <Button
                disabled={saving}
                type="submit"
                fullWidth
                size="lg"
                className="py-4 font-bold shadow-md"
              >
                {saving ? 'Salvando…' : 'Salvar Encomenda'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Excluir encomenda"
        message="Deseja realmente excluir esta encomenda? Essa ação não poderá ser desfeita."
        confirmLabel="Excluir encomenda"
        onConfirm={handleDelete}
      />
    </div>
  );
};
