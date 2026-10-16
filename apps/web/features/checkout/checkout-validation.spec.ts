import { describe, expect, it } from 'vitest';
import { validateCheckout } from './checkout-validation';

const validFields = {
  customerName: 'María Pérez',
  customerPhone: '70707070',
  deliveryAddress: 'Av. América 123, Cochabamba',
  notes: ''
};

describe('validateCheckout', () => {
  it('accepts a pickup order without a delivery address', () => {
    expect(
      validateCheckout({
        availableOrderTypes: ['PICKUP'],
        fields: { ...validFields, deliveryAddress: '' },
        orderType: 'PICKUP',
        servicesError: false,
        servicesLoading: false
      })
    ).toEqual({});
  });

  it('requires an address for delivery', () => {
    expect(
      validateCheckout({
        availableOrderTypes: ['DELIVERY'],
        fields: { ...validFields, deliveryAddress: 'Calle 1' },
        orderType: 'DELIVERY',
        servicesError: false,
        servicesLoading: false
      })
    ).toMatchObject({ deliveryAddress: expect.any(String) });
  });

  it('returns field errors for contact data rejected by the shared API contract', () => {
    expect(
      validateCheckout({
        availableOrderTypes: ['PICKUP'],
        fields: {
          ...validFields,
          customerName: 'a'.repeat(161),
          customerPhone: 'hola1234',
          notes: 'a'.repeat(1001)
        },
        orderType: 'PICKUP',
        servicesError: false,
        servicesLoading: false
      })
    ).toMatchObject({
      customerName: expect.any(String),
      customerPhone: expect.any(String),
      notes: expect.any(String)
    });
  });

  it('accepts formatted phone numbers and ignores an unused delivery address for pickup', () => {
    expect(
      validateCheckout({
        availableOrderTypes: ['PICKUP'],
        fields: { ...validFields, customerPhone: '+591 (7) 070-7070', deliveryAddress: 'a' },
        orderType: 'PICKUP',
        servicesError: false,
        servicesLoading: false
      })
    ).toEqual({});
  });

  it('rejects an order type that the branch no longer offers', () => {
    expect(
      validateCheckout({
        availableOrderTypes: ['PICKUP'],
        fields: validFields,
        orderType: 'DELIVERY',
        servicesError: false,
        servicesLoading: false
      })
    ).toMatchObject({ orderType: expect.any(String) });
  });
});
