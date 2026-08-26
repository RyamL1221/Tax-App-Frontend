import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const services = [
  {
    name: 'S3',
    description: 'Encrypted file storage',
  },
  {
    name: 'Lambda',
    description: 'Serverless processing',
  },
  {
    name: 'DynamoDB',
    description: 'Encrypted database',
  },
];

const Security: React.FC = () => {
  return (
    <section
      className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8 bg-gray-50"
      aria-labelledby="security-heading"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          id="security-heading"
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          Your Data is Secure
        </h2>

        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Built on AWS infrastructure with all data encrypted at rest and in
          transit, so your sensitive tax information stays protected.
        </p>

        <div
          className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3"
          role="list"
        >
          {services.map((service) => (
            <Card
              key={service.name}
              variant="elevated"
              role="listitem"
              className="text-center"
            >
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Security;
