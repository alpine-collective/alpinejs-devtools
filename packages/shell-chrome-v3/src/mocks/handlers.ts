import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://api.checkoutpage.co/api/v1/license-keys/validate', async ({ request }) => {
    const formData = await request.formData();
    const key = formData.get('key');

    if (key === 'INVALID-LICENSE-KEY') {
      return new HttpResponse(JSON.stringify({ message: 'This license key is not valid.' }), {
        status: 422,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // For the purpose of the simulator, we'll consider any key valid.
    // We can extend this later to test invalid key scenarios.
    if (key) {
      return HttpResponse.json({
        data: {
          uses: 1,
          enabled: true,
          key: key,
          product: {
            price: 9900,
            currency: 'usd',
            type: 'charge',
            title: 'Mock Product',
            id: 'mock-product-id',
          },
          variants: {},
          charge: 'mock-charge-id',
          customer: 'mock-customer-id',
          customerEmail: 'test@example.com',
          customerName: 'Test User',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          vendor: 'mock-vendor-id',
          id: 'mock-license-id',
        },
      });
    }

    // If no key is provided, return an error.
    return new HttpResponse(JSON.stringify({ message: 'Invalid license key' }), {
      status: 422,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }),
];
