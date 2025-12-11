import {type FC} from 'react';

export interface TopBarMarqueeProps {
  textContent: string;
  backgroundColor?: string;
  textColor?: string;
  speed?: number;
  separatorIcon?: string;
  enabled?: boolean;
}

const TopBarMarquee: FC<TopBarMarqueeProps> = ({
  textContent,
  backgroundColor = '#1e1b4b',
  textColor = '#ffffff',
  speed = 25,
  separatorIcon = '🎁',
  enabled = true,
}) => {
  if (!enabled || !textContent) {
    return null;
  }

  // Create repeated content for seamless loop
  const repeatedContent = Array(6)
    .fill(null)
    .map((_, index) => (
      <span key={index} className="flex items-center whitespace-nowrap">
        <span className="mx-4">{separatorIcon}</span>
        <span>{textContent}</span>
      </span>
    ));

  return (
    <div
      className="relative overflow-hidden py-2"
      style={{backgroundColor}}
    >
      <div
        className="flex animate-marquee"
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        <div
          className="flex items-center text-sm font-medium uppercase tracking-wider"
          style={{color: textColor}}
        >
          {repeatedContent}
        </div>
        {/* Duplicate for seamless loop */}
        <div
          className="flex items-center text-sm font-medium uppercase tracking-wider"
          style={{color: textColor}}
        >
          {repeatedContent}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TopBarMarquee;
