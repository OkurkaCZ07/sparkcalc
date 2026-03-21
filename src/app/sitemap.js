import { CALCULATORS } from '@/lib/utils';

export default function sitemap() {
  const baseUrl = 'https://sparkcalc.app';
  
  const calculatorPages = CALCULATORS.map((calc) => ({
    url: `${baseUrl}/calculators/${calc.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...calculatorPages,
  ];
}
