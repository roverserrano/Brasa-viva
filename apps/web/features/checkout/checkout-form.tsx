'use client';

import { PublicLink as Link } from '../../components/site/public-link';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { BranchDetailResponse, CreateOrderResponse } from '@brasa-viva/contracts';
import { ApiRequestError, createOrder, getBranchDetail } from '../../lib/api';
import { useCartStore } from '../cart/cart-store';
import { useCartReady } from '../cart/use-cart-ready';
import { buildCreateOrderRequest } from './checkout-order-payload';
import {
  type CheckoutErrors,
  type CheckoutFields,
  type CheckoutOrderType,
  validateCheckout
} from './checkout-validation';

const bolivianos = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2
});

const orderTypeLabels: Record<CheckoutOrderType, string> = {
  PICKUP: 'Recojo en sucursal',
  DELIVERY: 'Delivery coordinado'
};

export function CheckoutForm() {
  const ready = useCartReady();
  const submissionLock = useRef(false);
  const [retry, setRetry] = useState(0);
  const branch = useCartStore((state) => state.branch);
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [branchDetail, setBranchDetail] = useState<BranchDetailResponse | null>(null);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [orderType, setOrderType] = useState<CheckoutOrderType>('PICKUP');
  const [fields, setFields] = useState<CheckoutFields>({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    notes: ''
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    if (!branch) {
      setBranchDetail(null);
      setServicesError(null);
      setServicesLoading(false);
      return;
    }

    let active = true;
    setServicesLoading(true);
    setServicesError(null);
    setBranchDetail(null);

    void getBranchDetail(branch.slug)
      .then((detail) => {
        if (active) {
          setBranchDetail(detail);
        }
      })
      .catch(() => {
        if (active) {
          setServicesError(
            'No pudimos confirmar los servicios de esta sucursal. Intenta nuevamente.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setServicesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [branch?.slug, retry]);

  const availableOrderTypes = useMemo<CheckoutOrderType[]>(() => {
    if (!branchDetail) {
      return [];
    }

    return (['PICKUP', 'DELIVERY'] as const).filter((service) =>
      branchDetail.services.includes(service)
    );
  }, [branchDetail]);

  useEffect(() => {
    const firstAvailableOrderType = availableOrderTypes[0];

    if (firstAvailableOrderType && !availableOrderTypes.includes(orderType)) {
      setOrderType(firstAvailableOrderType);
    }
  }, [availableOrderTypes, orderType]);

  const estimatedSubtotal = items.reduce(
    (total, item) => total + Number(item.unitPrice) * item.quantity,
    0
  );

  function updateField(field: keyof CheckoutFields, value: string): void {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmissionError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submissionLock.current) return;

    if (items.length === 0 || !branch) {
      return;
    }

    const nextErrors = validateCheckout({
      availableOrderTypes,
      fields,
      orderType,
      servicesError: Boolean(servicesError),
      servicesLoading
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }

    submissionLock.current = true;
    setSubmitting(true);
    setSubmissionError(null);

    try {
      const order = await createOrder(
        buildCreateOrderRequest({
          branchSlug: branch.slug,
          fields,
          items,
          orderType
        })
      );

      setCreatedOrder(order);
      clear();
    } catch (error: unknown) {
      setSubmissionError(
        error instanceof ApiRequestError
          ? error.message
          : 'No pudimos registrar tu pedido. Verifica tu conexión e inténtalo nuevamente.'
      );
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  if (createdOrder) {
    return <OrderConfirmation order={createdOrder} />;
  }
  if (!ready)
    return (
      <p className="mt-8" role="status">
        Recuperando tu pedido…
      </p>
    );

  if (!branch || items.length === 0) {
    return (
      <section className="checkout-card public-empty mt-10">
        <h2 className="text-2xl font-black">Tu carrito está vacío.</h2>
        <p className="mt-3 leading-7 text-stone-700">
          Añade productos desde el menú antes de preparar un pedido.
        </p>
        <Link className="public-button mt-6" href="/menu">
          Explorar el menú
        </Link>
      </section>
    );
  }

  return (
    <form
      className="checkout-form mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <section className="checkout-card">
          <p className="text-sm font-black tracking-[0.12em] text-red-700">SUCURSAL ELEGIDA</p>
          <h2 className="mt-2 text-2xl font-black">{branch.name}</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Aquí recibirán tu pedido. Puedes revisar las cantidades antes de confirmar.
          </p>
          <Link
            className="mt-4 inline-flex text-sm font-black text-red-700 underline"
            href="/carrito"
          >
            Volver al carrito
          </Link>
        </section>

        <fieldset
          className="checkout-card"
          disabled={servicesLoading || Boolean(servicesError) || submitting}
        >
          <legend className="text-2xl font-black">¿Cómo recibirás tu pedido?</legend>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Solo se muestran los servicios habilitados por esta sucursal.
          </p>
          {servicesLoading ? (
            <p className="mt-5 text-sm font-bold text-stone-600">
              Verificando servicios disponibles…
            </p>
          ) : null}
          {servicesError ? (
            <p className="mt-5 text-sm font-bold text-red-700" role="alert">
              {servicesError}
            </p>
          ) : null}
          {!servicesLoading &&
          !servicesError &&
          branchDetail &&
          availableOrderTypes.length === 0 ? (
            <p className="mt-5 text-sm font-bold text-red-700" role="alert">
              Esta sucursal no recibe pedidos por el momento.
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {availableOrderTypes.map((service) => (
              <label
                className={`cursor-pointer rounded-2xl border-2 p-4 ${orderType === service ? 'border-red-700 bg-red-50' : 'border-stone-200'}`}
                key={service}
              >
                <input
                  checked={orderType === service}
                  className="mr-2 accent-red-700"
                  name="orderType"
                  onChange={() => {
                    setOrderType(service);
                    setErrors((current) => ({ ...current, orderType: undefined }));
                    setSubmissionError(null);
                  }}
                  type="radio"
                  value={service}
                />
                <span className="block font-black">{orderTypeLabels[service]}</span>
                <span className="mt-1 block text-sm leading-6 text-stone-700">
                  {service === 'PICKUP'
                    ? 'Recógelo directamente en la sucursal.'
                    : 'La sucursal coordinará condiciones y costo contigo.'}
                </span>
              </label>
            ))}
          </div>
          {errors.orderType ? (
            <p className="mt-3 text-sm font-bold text-red-700" role="alert">
              {errors.orderType}
            </p>
          ) : null}
        </fieldset>
        {servicesError ? (
          <button
            type="button"
            className="rounded-full border border-red-700 px-5 py-3 font-bold text-red-800"
            onClick={() => setRetry((value) => value + 1)}
          >
            Volver a comprobar la sucursal
          </button>
        ) : null}

        <section className="checkout-card">
          <h2 className="text-2xl font-black">Tus datos</h2>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            Los usaremos únicamente para registrar y coordinar este pedido.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              disabled={submitting}
              error={errors.customerName}
              label="Nombre completo"
              name="customerName"
              autoComplete="name"
              maxLength={160}
              required
              onChange={(value) => updateField('customerName', value)}
              value={fields.customerName}
            />
            <Field
              disabled={submitting}
              error={errors.customerPhone}
              inputMode="tel"
              label="Teléfono o WhatsApp"
              name="customerPhone"
              autoComplete="tel"
              maxLength={40}
              required
              onChange={(value) => updateField('customerPhone', value)}
              type="tel"
              value={fields.customerPhone}
            />
          </div>
          {orderType === 'DELIVERY' ? (
            <div className="mt-5">
              <Field
                disabled={submitting}
                error={errors.deliveryAddress}
                label="Dirección de entrega"
                name="deliveryAddress"
                autoComplete="street-address"
                maxLength={500}
                required
                multiline
                onChange={(value) => updateField('deliveryAddress', value)}
                value={fields.deliveryAddress}
              />
            </div>
          ) : null}
          <div className="mt-5">
            <Field
              disabled={submitting}
              hint="Opcional: referencias o indicaciones para el equipo."
              label="Notas"
              error={errors.notes}
              name="notes"
              maxLength={1000}
              multiline
              onChange={(value) => updateField('notes', value)}
              value={fields.notes}
            />
          </div>
        </section>
      </div>

      <aside className="checkout-summary h-fit p-6 text-white lg:sticky lg:top-6">
        <p className="text-sm font-black tracking-[0.12em] text-yellow-300">RESUMEN</p>
        <ul className="mt-5 space-y-4 border-b border-stone-700 pb-5">
          {items.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={item.productId}>
              <span>
                <strong>{item.quantity}×</strong> {item.name}
              </span>
              <span className="whitespace-nowrap font-bold">
                {bolivianos.format(Number(item.unitPrice) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-stone-300">Total estimado</p>
            <p className="mt-1 text-3xl font-black">{bolivianos.format(estimatedSubtotal)}</p>
          </div>
          <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-bold">
            No incluye delivery
          </span>
        </div>
        <p className="mt-4 text-xs leading-5 text-stone-300">
          Confirmaremos precios y promociones al registrar tu pedido. Después podrás enviarlo a la
          sucursal por WhatsApp.
        </p>
        <button
          className="public-button public-button-light mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={
            servicesLoading ||
            Boolean(servicesError) ||
            availableOrderTypes.length === 0 ||
            submitting
          }
          type="submit"
        >
          {submitting ? 'Registrando pedido…' : 'Confirmar y registrar pedido'}
        </button>
        {submissionError ? (
          <p
            className="mt-4 rounded-2xl bg-red-950/70 p-4 text-sm leading-6 text-red-100"
            role="alert"
          >
            {submissionError}
          </p>
        ) : null}
      </aside>
    </form>
  );
}

function OrderConfirmation({ order }: { order: CreateOrderResponse }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section className="checkout-card order-confirmation mt-10">
      <p className="text-sm font-black tracking-[0.12em] text-red-700">PEDIDO REGISTRADO</p>
      <h2 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-black">
        Tu pedido {order.orderCode} está recibido.
      </h2>
      <p className="mt-3 max-w-2xl leading-7 text-stone-700">
        Registramos tu pedido en {order.branch.name}. Continúa por WhatsApp para coordinar la
        atención con el equipo; el costo de delivery, si aplica, se confirma con la sucursal.
      </p>
      <div className="mt-6 rounded-2xl bg-stone-950 p-5 text-white">
        <ul className="space-y-3 border-b border-stone-700 pb-4 text-sm">
          {order.items.map((item) => (
            <li className="flex justify-between gap-4" key={item.productId}>
              <span>
                {item.quantity}× {item.productName}
              </span>
              <span className="font-bold">{bolivianos.format(Number(item.lineTotal))}</span>
            </li>
          ))}
        </ul>
        {Number(order.discountTotal) > 0 ? (
          <p className="mt-4 text-sm text-yellow-300">
            Promociones aplicadas: −{bolivianos.format(Number(order.discountTotal))}
          </p>
        ) : null}
        <div className="mt-4 flex items-end justify-between gap-4">
          <span className="text-sm text-stone-300">Total confirmado</span>
          <strong className="text-3xl">{bolivianos.format(Number(order.total))}</strong>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-4">
        {order.whatsappUrl ? (
          <a
            className="inline-flex rounded-full bg-green-700 px-5 py-3 font-black text-white transition hover:bg-green-600"
            href={order.whatsappUrl}
            rel="noreferrer"
            target="_blank"
          >
            Continuar por WhatsApp
          </a>
        ) : (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950">
            La sucursal no tiene un WhatsApp configurado. Conserva el código {order.orderCode} para
            contactarla.
          </p>
        )}
        <Link
          className="inline-flex rounded-full border-2 border-stone-950 px-5 py-3 font-black text-stone-950"
          href="/menu"
        >
          Hacer otro pedido
        </Link>
      </div>
    </section>
  );
}

type FieldProps = {
  name: string;
  autoComplete?: 'name' | 'tel' | 'street-address';
  maxLength: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  inputMode?: 'tel';
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  type?: 'tel' | 'text';
  value: string;
};

function Field({
  name,
  autoComplete,
  maxLength,
  required = false,
  disabled = false,
  error,
  hint,
  inputMode,
  label,
  multiline = false,
  onChange,
  type = 'text',
  value
}: FieldProps) {
  const id = label.toLowerCase().replaceAll(' ', '-');
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const className = `mt-2 w-full rounded-xl border bg-white px-4 py-3 text-stone-950 ${error ? 'border-red-700' : 'border-stone-300'}`;

  return (
    <div>
      <label className="font-bold" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={className}
          disabled={disabled}
          id={id}
          name={name}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          value={value}
        />
      ) : (
        <input
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          className={className}
          disabled={disabled}
          id={id}
          name={name}
          autoComplete={autoComplete}
          maxLength={maxLength}
          required={required}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          value={value}
        />
      )}
      {hint ? (
        <p className="mt-2 text-sm text-stone-600" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm font-bold text-red-700" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
