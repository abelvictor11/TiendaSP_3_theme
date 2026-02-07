import {type FC, useState, useMemo} from 'react';
import {ChevronDownIcon, ChevronUpIcon, CheckCircleIcon} from '@heroicons/react/24/outline';
import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

interface CreditPartner {
  name: string;
  logoUrl: string;
  badge?: string;
  link?: string;
}

interface CreditBenefit {
  text: string;
  highlightText?: string;
  linkText?: string;
  linkUrl?: string;
}

interface CreditCalculatorConfig {
  enabled: boolean;
  title: string;
  monthlyLabel: string;
  installmentsLabel: string;
  partnersTitle: string;
  partners: CreditPartner[];
  installmentOptions: number[];
  defaultInstallments: number;
  benefits: CreditBenefit[];
}

interface CreditCalculatorProps {
  price: MoneyV2;
  config?: CreditCalculatorConfig | null;
  className?: string;
}

const DEFAULT_CONFIG: CreditCalculatorConfig = {
  enabled: true,
  title: 'Opciones de financiación',
  monthlyLabel: 'Cuota mensual',
  installmentsLabel: 'Pagar en',
  partnersTitle: 'Métodos de crédito disponibles',
  partners: [
    {name: 'Addi', logoUrl: '', badge: '0% Interés'},
    {name: 'Mercado Pago', logoUrl: '', badge: '0% Interés'},
    {name: 'Sistecrédito', logoUrl: '', badge: '0% Interés'},
  ],
  installmentOptions: [3, 6, 12, 24],
  defaultInstallments: 12,
  benefits: [
    {text: 'Paga hasta en 24 meses con Addi, Mercado Pago y Sistecrédito.'},
    {text: 'Si no quieres usar estas opciones,', highlightText: '¡no te preocupes!', linkText: 'Contacta a un asesor'},
    {text: 'Además, si tienes una bicicleta usada, pregunta por nuestro plan de retoma.', linkText: 'Términos y condiciones'},
  ],
};

const CreditCalculator: FC<CreditCalculatorProps> = ({
  price,
  config,
  className = '',
}) => {
  const settings = config || DEFAULT_CONFIG;
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(settings.defaultInstallments);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const monthlyPayment = useMemo(() => {
    const amount = parseFloat(price.amount) / selectedInstallments;
    return {
      amount: amount.toFixed(0),
      currencyCode: price.currencyCode,
    } as MoneyV2;
  }, [price, selectedInstallments]);

  if (!settings.enabled) return null;

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
      {/* Header - Always visible, clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-[#efefef] dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-900 dark:text-white">{settings.title}</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Desde <span className="font-semibold text-primary-600 dark:text-primary-400">
                <Money data={monthlyPayment} />
              </span>/mes
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Expandable content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Calculator card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{settings.monthlyLabel}</p>
                <p className="text-3xl sm:text-4xl font-bold">
                  <Money data={monthlyPayment} />
                </p>
              </div>
              
              {/* Installments dropdown */}
              <div className="relative">
                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1 text-right">{settings.installmentsLabel}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="flex items-center justify-between gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 min-w-[140px] transition-colors"
                >
                  <span className="font-semibold">{selectedInstallments} cuotas</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded-lg shadow-xl z-10 min-w-[140px] overflow-hidden">
                    {settings.installmentOptions.map((option) => (
                      <button
                        key={option}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInstallments(option);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-slate-600 transition-colors flex items-center justify-between ${
                          selectedInstallments === option ? 'bg-primary-600' : ''
                        }`}
                      >
                        <span>{option} cuotas</span>
                        {selectedInstallments === option && (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Partners section */}
          {settings.partners.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-3">{settings.partnersTitle}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {settings.partners.map((partner, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                  >
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.name}
                        className="h-8 object-contain mb-2"
                      />
                    ) : (
                      <span className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        {partner.name}
                      </span>
                    )}
                    {partner.badge && (
                      <span className="text-xs font-medium bg-slate-900 dark:bg-slate-600 text-white px-3 py-1 rounded-full">
                        {partner.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Benefits list */}
          {settings.benefits.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              {settings.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {benefit.text}
                    {benefit.highlightText && (
                      <span className="font-semibold"> {benefit.highlightText}</span>
                    )}
                    {benefit.linkText && benefit.linkUrl && (
                      <a
                        href={benefit.linkUrl}
                        className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
                      >
                        {benefit.linkText}
                      </a>
                    )}
                    {benefit.linkText && !benefit.linkUrl && (
                      <span className="text-primary-600 dark:text-primary-400 font-medium ml-1">
                        {benefit.linkText}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditCalculator;
