import {useState, useCallback, useEffect, type FC} from 'react';
import {XMarkIcon} from '@heroicons/react/24/solid';
import clsx from 'clsx';

// ─── Types ───────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female';
type RidingStyle = 'sportive' | 'neutral' | 'comfortable';
type BikeType = 'road' | 'mtb' | 'gravel' | 'ebike' | 'urban';

interface SizeRange {
  label: string;
  minHeight: number; // cm
  maxHeight: number; // cm
  minInseam: number; // cm
  maxInseam: number; // cm
  frameSize: string; // e.g. "52cm", "17.5\""
}

interface SizeResult {
  size: string;
  frameSize: string;
  fit: 'perfect' | 'close' | 'no-fit';
}

interface BikeSizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  productImage?: string;
  bikeType?: BikeType;
  availableSizes?: string[];
}

// ─── Size Tables (Industry Standard) ─────────────────────────────────────────

const ROAD_SIZES: SizeRange[] = [
  {label: 'XXS', minHeight: 148, maxHeight: 155, minInseam: 66, maxInseam: 71, frameSize: '44-47cm'},
  {label: 'XS', minHeight: 155, maxHeight: 162, minInseam: 70, maxInseam: 75, frameSize: '48-50cm'},
  {label: 'S', minHeight: 162, maxHeight: 170, minInseam: 74, maxInseam: 80, frameSize: '51-53cm'},
  {label: 'M', minHeight: 170, maxHeight: 178, minInseam: 79, maxInseam: 85, frameSize: '54-56cm'},
  {label: 'L', minHeight: 178, maxHeight: 186, minInseam: 84, maxInseam: 90, frameSize: '57-59cm'},
  {label: 'XL', minHeight: 186, maxHeight: 194, minInseam: 89, maxInseam: 95, frameSize: '60-62cm'},
  {label: 'XXL', minHeight: 194, maxHeight: 205, minInseam: 94, maxInseam: 100, frameSize: '63-65cm'},
];

const MTB_SIZES: SizeRange[] = [
  {label: 'XS', minHeight: 148, maxHeight: 158, minInseam: 66, maxInseam: 73, frameSize: '13.5-14.5"'},
  {label: 'S', minHeight: 158, maxHeight: 168, minInseam: 72, maxInseam: 79, frameSize: '15.5-16.5"'},
  {label: 'M', minHeight: 168, maxHeight: 178, minInseam: 78, maxInseam: 85, frameSize: '17.5-18.5"'},
  {label: 'L', minHeight: 178, maxHeight: 188, minInseam: 84, maxInseam: 91, frameSize: '19.5-20.5"'},
  {label: 'XL', minHeight: 188, maxHeight: 198, minInseam: 90, maxInseam: 97, frameSize: '21.5-22.5"'},
  {label: 'XXL', minHeight: 198, maxHeight: 210, minInseam: 96, maxInseam: 103, frameSize: '23-24"'},
];

const GRAVEL_SIZES: SizeRange[] = [
  {label: 'XS', minHeight: 155, maxHeight: 163, minInseam: 70, maxInseam: 76, frameSize: '48-50cm'},
  {label: 'S', minHeight: 163, maxHeight: 171, minInseam: 75, maxInseam: 81, frameSize: '51-53cm'},
  {label: 'M', minHeight: 171, maxHeight: 179, minInseam: 80, maxInseam: 86, frameSize: '54-56cm'},
  {label: 'L', minHeight: 179, maxHeight: 187, minInseam: 85, maxInseam: 91, frameSize: '57-59cm'},
  {label: 'XL', minHeight: 187, maxHeight: 195, minInseam: 90, maxInseam: 96, frameSize: '60-62cm'},
];

function getSizeTable(bikeType: BikeType): SizeRange[] {
  switch (bikeType) {
    case 'mtb': return MTB_SIZES;
    case 'gravel': return GRAVEL_SIZES;
    case 'road':
    case 'ebike':
    case 'urban':
    default: return ROAD_SIZES;
  }
}

// ─── Calculation Helpers ─────────────────────────────────────────────────────

function estimateInseam(heightCm: number, gender: Gender): number {
  // Average inseam is ~45% of height for men, ~44% for women
  const ratio = gender === 'male' ? 0.45 : 0.44;
  return Math.round(heightCm * ratio * 10) / 10;
}

function calculateSize(
  heightCm: number,
  inseamCm: number,
  style: RidingStyle,
  bikeType: BikeType,
  availableSizes?: string[],
): SizeResult[] {
  const table = getSizeTable(bikeType);

  // Style adjustment: sportive = smaller frame, comfortable = larger frame
  const styleOffset = style === 'sportive' ? -1 : style === 'comfortable' ? 1 : 0;

  const results: SizeResult[] = [];

  for (const size of table) {
    const heightMid = (size.minHeight + size.maxHeight) / 2;
    const inseamMid = (size.minInseam + size.maxInseam) / 2;

    const heightInRange = heightCm >= size.minHeight && heightCm <= size.maxHeight;
    const inseamInRange = inseamCm >= size.minInseam && inseamCm <= size.maxInseam;

    const heightClose =
      heightCm >= size.minHeight - 3 && heightCm <= size.maxHeight + 3;
    const inseamClose =
      inseamCm >= size.minInseam - 2 && inseamCm <= size.maxInseam + 2;

    if (heightInRange && inseamInRange) {
      results.push({size: size.label, frameSize: size.frameSize, fit: 'perfect'});
    } else if (heightClose && inseamClose) {
      results.push({size: size.label, frameSize: size.frameSize, fit: 'close'});
    }
  }

  // Apply style offset
  if (styleOffset !== 0 && results.length > 1) {
    // If sportive, prefer the smaller size; if comfortable, prefer the larger
    if (styleOffset < 0) {
      results.sort((a, b) => {
        const aIdx = table.findIndex((s) => s.label === a.size);
        const bIdx = table.findIndex((s) => s.label === b.size);
        return aIdx - bIdx;
      });
    } else {
      results.sort((a, b) => {
        const aIdx = table.findIndex((s) => s.label === a.size);
        const bIdx = table.findIndex((s) => s.label === b.size);
        return bIdx - aIdx;
      });
    }
  }

  // Filter by available sizes if provided
  if (availableSizes && availableSizes.length > 0) {
    const normalizedAvailable = availableSizes.map((s) => s.toUpperCase().trim());
    const filtered = results.filter((r) =>
      normalizedAvailable.some(
        (a) => a.includes(r.size) || r.size.includes(a),
      ),
    );
    if (filtered.length > 0) return filtered;
  }

  return results.length > 0 ? results : [{size: 'N/A', frameSize: '', fit: 'no-fit'}];
}

// ─── SVG Illustrations ───────────────────────────────────────────────────────

const BodyFrontSVG: FC<{gender: Gender; highlightArea?: 'full' | 'legs' | 'torso' | 'none'}> = ({
  gender,
  highlightArea = 'none',
}) => (
  <svg viewBox="0 0 200 400" className="w-full h-full max-h-[320px]" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Highlight area */}
    {highlightArea === 'full' && (
      <rect x="50" y="20" width="100" height="360" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="6 3" />
    )}
    {highlightArea === 'legs' && (
      <rect x="55" y="200" width="90" height="180" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5" strokeDasharray="6 3" />
    )}
    {/* Head */}
    <ellipse cx="100" cy="45" rx="22" ry="28" stroke="#94a3b8" strokeWidth="1.5" />
    {/* Neck */}
    <line x1="100" y1="73" x2="100" y2="90" stroke="#94a3b8" strokeWidth="1.5" />
    {/* Shoulders */}
    <line x1="60" y1="90" x2="140" y2="90" stroke="#94a3b8" strokeWidth="1.5" />
    {/* Torso */}
    <path d="M60 90 L55 200 L80 200 L80 200" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <path d="M140 90 L145 200 L120 200 L120 200" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Hips */}
    <path d="M55 200 Q100 220 145 200" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Arms */}
    <path d="M60 90 L35 160 L30 200" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <path d="M140 90 L165 160 L170 200" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Hands */}
    <circle cx="30" cy="203" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <circle cx="170" cy="203" r="5" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Left leg */}
    <path d="M80 200 L75 290 L72 370" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Right leg */}
    <path d="M120 200 L125 290 L128 370" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Feet */}
    <path d="M72 370 L60 375 L60 380 L80 380 L80 375" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <path d="M128 370 L140 375 L140 380 L120 380 L120 375" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    {/* Question mark indicator */}
    {highlightArea !== 'none' && (
      <g>
        <circle cx="145" cy={highlightArea === 'legs' ? 280 : 140} r="14" fill="#ef4444" />
        <text x="145" y={highlightArea === 'legs' ? 286 : 146} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">?</text>
      </g>
    )}
  </svg>
);

const CyclistSideSVG: FC<{style: RidingStyle}> = ({style}) => {
  // Adjust posture based on riding style
  const torsoAngle = style === 'sportive' ? -35 : style === 'comfortable' ? -10 : -22;

  return (
    <svg viewBox="0 0 300 350" className="w-full h-full max-h-[320px]" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bike frame simplified */}
      <circle cx="80" cy="260" r="45" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
      <circle cx="220" cy="260" r="45" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
      {/* Frame */}
      <line x1="80" y1="260" x2="150" y2="200" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="150" y1="200" x2="220" y2="260" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="150" y1="200" x2="150" y2="170" stroke="#d1d5db" strokeWidth="1.5" />
      <line x1="150" y1="170" x2="220" y2="260" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Seat post */}
      <line x1="150" y1="200" x2="140" y2="165" stroke="#d1d5db" strokeWidth="2" />
      {/* Handlebars */}
      <line x1="220" y1="200" x2="230" y2="185" stroke="#d1d5db" strokeWidth="2" />
      <line x1="220" y1="200" x2="220" y2="260" stroke="#d1d5db" strokeWidth="1.5" />
      {/* Rider - positioned on bike */}
      {/* Hips on seat */}
      <circle cx="142" cy="155" r="4" fill="#94a3b8" />
      {/* Torso - angle varies by style */}
      <line
        x1="142"
        y1="155"
        x2={142 + Math.cos((torsoAngle * Math.PI) / 180) * 70}
        y2={155 + Math.sin((torsoAngle * Math.PI) / 180) * 70}
        stroke="#94a3b8"
        strokeWidth="2"
      />
      {/* Head */}
      <ellipse
        cx={142 + Math.cos((torsoAngle * Math.PI) / 180) * 80}
        cy={155 + Math.sin((torsoAngle * Math.PI) / 180) * 80}
        rx="14"
        ry="18"
        stroke="#94a3b8"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Arms to handlebars */}
      <line
        x1={142 + Math.cos((torsoAngle * Math.PI) / 180) * 55}
        y1={155 + Math.sin((torsoAngle * Math.PI) / 180) * 55}
        x2="228"
        y2="183"
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      {/* Legs */}
      <line x1="142" y1="155" x2="120" y2="220" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="120" y1="220" x2="80" y2="260" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="142" y1="155" x2="160" y2="230" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="160" y1="230" x2="150" y2="270" stroke="#94a3b8" strokeWidth="1.5" />
      {/* Question mark */}
      <g>
        <circle cx="185" cy="120" r="14" fill="#ef4444" />
        <text x="185" y="126" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">?</text>
      </g>
    </svg>
  );
};

// ─── Step Components ─────────────────────────────────────────────────────────

const StepIndicator: FC<{currentStep: number; totalSteps: number}> = ({
  currentStep,
  totalSteps,
}) => (
  <div className="flex gap-1">
    {Array.from({length: totalSteps}, (_, i) => (
      <div
        key={i}
        className={clsx(
          'w-8 h-7 flex items-center justify-center text-xs font-bold rounded',
          i + 1 === currentStep
            ? 'bg-black text-white'
            : i + 1 < currentStep
              ? 'bg-black/80 text-white'
              : 'bg-slate-200 text-slate-500',
        )}
      >
        {i + 1}
      </div>
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BikeSizeGuide: FC<BikeSizeGuideProps> = ({
  isOpen,
  onClose,
  productTitle = '',
  productImage,
  bikeType = 'road',
  availableSizes = [],
}) => {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender>('male');
  const [heightCm, setHeightCm] = useState(170);
  const [inseamCm, setInseamCm] = useState(76.5);
  const [ridingStyle, setRidingStyle] = useState<RidingStyle>('neutral');
  const [results, setResults] = useState<SizeResult[]>([]);

  const totalSteps = 4;

  // Update inseam estimate when height or gender changes
  useEffect(() => {
    if (step <= 1) {
      setInseamCm(estimateInseam(heightCm, gender));
    }
  }, [heightCm, gender, step]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setGender('male');
      setHeightCm(170);
      setInseamCm(estimateInseam(170, 'male'));
      setRidingStyle('neutral');
      setResults([]);
    }
  }, [isOpen]);

  const handleContinue = useCallback(() => {
    if (step < totalSteps) {
      if (step === 3) {
        // Calculate results before showing step 4
        const sizeResults = calculateSize(heightCm, inseamCm, ridingStyle, bikeType, availableSizes);
        setResults(sizeResults);
      }
      setStep((s) => s + 1);
    }
  }, [step, heightCm, inseamCm, ridingStyle, bikeType, availableSizes]);

  const handleRestart = useCallback(() => {
    setStep(1);
    setGender('male');
    setHeightCm(170);
    setInseamCm(estimateInseam(170, 'male'));
    setRidingStyle('neutral');
    setResults([]);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Close / Restart buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {step === totalSteps && (
            <button
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              Reiniciar
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {/* Product info + Step indicator */}
          <div className="flex items-start gap-4 mb-6">
            {productImage && (
              <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                <img src={productImage} alt={productTitle} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <StepIndicator currentStep={step} totalSteps={totalSteps} />
              {productTitle && (
                <h3 className="text-lg font-bold mt-2 truncate">{productTitle}</h3>
              )}
              <p className="text-sm text-slate-500">Te ayudaremos a encontrar tu talla ideal.</p>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left: Form */}
            <div className="flex-1">
              {step === 1 && (
                <StepGenderHeight
                  gender={gender}
                  setGender={setGender}
                  heightCm={heightCm}
                  setHeightCm={setHeightCm}
                />
              )}
              {step === 2 && (
                <StepInseam
                  gender={gender}
                  heightCm={heightCm}
                  inseamCm={inseamCm}
                  setInseamCm={setInseamCm}
                />
              )}
              {step === 3 && (
                <StepRidingStyle
                  ridingStyle={ridingStyle}
                  setRidingStyle={setRidingStyle}
                />
              )}
              {step === 4 && (
                <StepResult
                  results={results}
                  productTitle={productTitle}
                  productImage={productImage}
                  onClose={onClose}
                />
              )}
            </div>

            {/* Right: Illustration */}
            <div className="hidden lg:flex w-[280px] flex-shrink-0 items-center justify-center">
              {step === 1 && <BodyFrontSVG gender={gender} highlightArea="full" />}
              {step === 2 && <BodyFrontSVG gender={gender} highlightArea="legs" />}
              {step === 3 && <CyclistSideSVG style={ridingStyle} />}
            </div>
          </div>

          {/* Continue button */}
          {step < totalSteps && (
            <button
              onClick={handleContinue}
              className="w-full mt-8 py-4 bg-black text-white text-base font-semibold rounded-xl hover:bg-black/90 transition-colors"
            >
              {step === 3 ? 'Ver mi talla' : 'Continuar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Step 1: Gender + Height ─────────────────────────────────────────────────

const StepGenderHeight: FC<{
  gender: Gender;
  setGender: (g: Gender) => void;
  heightCm: number;
  setHeightCm: (h: number) => void;
}> = ({gender, setGender, heightCm, setHeightCm}) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-lg font-bold mb-1">¿Cuál es tu sexo?</h4>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          onClick={() => setGender('male')}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
            gender === 'male'
              ? 'border-black bg-white'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <div className={clsx(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            gender === 'male' ? 'border-black' : 'border-slate-300',
          )}>
            {gender === 'male' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
          </div>
          <span className="font-medium">Hombre</span>
        </button>
        <button
          onClick={() => setGender('female')}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left',
            gender === 'female'
              ? 'border-black bg-white'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <div className={clsx(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            gender === 'female' ? 'border-black' : 'border-slate-300',
          )}>
            {gender === 'female' && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
          </div>
          <span className="font-medium">Mujer</span>
        </button>
      </div>
    </div>

    <div>
      <h4 className="text-lg font-bold mb-1">¿Cuál es tu estatura?</h4>
      <div className="flex items-center gap-4 mt-3">
        <input
          type="number"
          value={heightCm}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black"
          min={130}
          max={220}
        />
        <span className="text-sm text-slate-500">cm</span>
      </div>
      <div className="mt-4">
        <input
          type="range"
          min={130}
          max={220}
          value={heightCm}
          onChange={(e) => setHeightCm(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>130 cm</span>
          <span>220 cm</span>
        </div>
      </div>
    </div>
  </div>
);

// ─── Step 2: Inseam ──────────────────────────────────────────────────────────

const StepInseam: FC<{
  gender: Gender;
  heightCm: number;
  inseamCm: number;
  setInseamCm: (v: number) => void;
}> = ({gender, heightCm, inseamCm, setInseamCm}) => {
  const minInseam = Math.round(heightCm * 0.38);
  const maxInseam = Math.round(heightCm * 0.52);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold mb-1">Largo de entrepierna</h4>
        <p className="text-sm text-slate-500">
          La mayoría de {gender === 'male' ? 'hombres' : 'mujeres'} con tu estatura ({heightCm} cm) tienen un largo de entrepierna promedio de:
        </p>
      </div>

      <div>
        <p className="text-sm text-slate-500 mb-2">
          ¿Piernas más cortas o largas de lo calculado? Mide y edita el valor:
        </p>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={inseamCm}
            onChange={(e) => setInseamCm(Number(e.target.value))}
            step={0.5}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-black"
            min={minInseam}
            max={maxInseam}
          />
          <span className="text-sm text-slate-500">cm</span>
        </div>
      </div>

      <div>
        <input
          type="range"
          min={minInseam}
          max={maxInseam}
          step={0.5}
          value={inseamCm}
          onChange={(e) => setInseamCm(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>{minInseam} cm</span>
          <span>{maxInseam} cm</span>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-500">
          <strong>¿Cómo medir?</strong> Párate descalzo contra una pared con las piernas ligeramente separadas. Coloca un libro entre tus piernas presionando hacia arriba. Mide desde el borde superior del libro hasta el suelo.
        </p>
      </div>
    </div>
  );
};

// ─── Step 3: Riding Style ────────────────────────────────────────────────────

const StepRidingStyle: FC<{
  ridingStyle: RidingStyle;
  setRidingStyle: (s: RidingStyle) => void;
}> = ({ridingStyle, setRidingStyle}) => {
  const styles: {value: RidingStyle; label: string}[] = [
    {value: 'sportive', label: 'Deportivo'},
    {value: 'neutral', label: 'Neutral'},
    {value: 'comfortable', label: 'Cómodo'},
  ];

  const styleIndex = styles.findIndex((s) => s.value === ridingStyle);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-bold mb-1">¿Cuál es tu estilo de conducción?</h4>
        <p className="text-sm text-slate-500">
          Elegiremos la talla perfecta según tus datos corporales y tu estilo de conducción.
        </p>
      </div>

      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={2}
          value={styleIndex}
          onChange={(e) => setRidingStyle(styles[Number(e.target.value)].value)}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-black"
        />
        <div className="flex justify-between mt-2">
          {styles.map((s) => (
            <button
              key={s.value}
              onClick={() => setRidingStyle(s.value)}
              className={clsx(
                'text-sm font-medium transition-colors',
                ridingStyle === s.value ? 'text-black' : 'text-slate-400',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mt-4">
        {ridingStyle === 'sportive' && (
          <div>
            <h5 className="font-bold text-sm mb-1">Deportivo</h5>
            <p className="text-xs text-slate-500">
              Posición aerodinámica y agresiva. Ideal para ciclismo de competición, trail riding ágil en MTB, o posiciones compactas en e-bikes urbanas.
            </p>
          </div>
        )}
        {ridingStyle === 'neutral' && (
          <div>
            <h5 className="font-bold text-sm mb-1">Neutral</h5>
            <p className="text-xs text-slate-500">
              Un equilibrio entre rendimiento y comodidad. Si no tienes preferencia, elegiremos la bicicleta que mejor se adapte a tus datos corporales.
            </p>
          </div>
        )}
        {ridingStyle === 'comfortable' && (
          <div>
            <h5 className="font-bold text-sm mb-1">Cómodo</h5>
            <p className="text-xs text-slate-500">
              Posición más erguida y relajada. Ideal para paseos largos, trekking, o si prefieres mayor comodidad en tu bicicleta de ruta o gravel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Step 4: Result ──────────────────────────────────────────────────────────

const StepResult: FC<{
  results: SizeResult[];
  productTitle?: string;
  productImage?: string;
  onClose: () => void;
}> = ({results, productTitle, productImage, onClose}) => {
  const bestResult = results[0];
  const hasFit = bestResult && bestResult.fit !== 'no-fit';

  return (
    <div className="space-y-6">
      {productImage && (
        <div className="flex justify-center">
          <img src={productImage} alt={productTitle} className="h-40 object-contain" />
        </div>
      )}

      <div className="text-center">
        {hasFit ? (
          <>
            <p className="text-lg font-medium text-slate-600 mb-3">Tu talla recomendada:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {results.map((r, i) => (
                <div
                  key={r.size}
                  className={clsx(
                    'px-8 py-4 rounded-xl border-2 text-center transition-all',
                    i === 0
                      ? 'border-black bg-white shadow-lg'
                      : 'border-slate-200',
                  )}
                >
                  <div className={clsx(
                    'text-3xl font-black',
                    i === 0 ? 'text-black' : 'text-slate-500',
                  )}>
                    {r.size}
                  </div>
                  {r.frameSize && (
                    <div className="text-xs text-slate-400 mt-1">{r.frameSize}</div>
                  )}
                  {r.fit === 'perfect' && i === 0 && (
                    <div className="text-xs text-green-600 font-medium mt-1">✓ Ajuste perfecto</div>
                  )}
                  {r.fit === 'close' && (
                    <div className="text-xs text-amber-600 font-medium mt-1">~ Ajuste aproximado</div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div>
            <p className="text-lg font-medium text-slate-600 mb-2">
              No encontramos una talla exacta para tus medidas.
            </p>
            <p className="text-sm text-slate-500">
              Te recomendamos visitar una tienda para una medición personalizada.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full py-4 bg-black text-white text-base font-semibold rounded-xl hover:bg-black/90 transition-colors"
      >
        Continuar comprando
      </button>
    </div>
  );
};

export default BikeSizeGuide;
