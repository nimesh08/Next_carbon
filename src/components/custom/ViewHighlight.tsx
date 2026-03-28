import React from "react";

interface Highlight {
  highlight?: string;
  title?: string;
  description?: string;
}

interface ViewHighlightProps {
  highlights: Highlight[];
}

const ViewHighlight: React.FC<ViewHighlightProps> = ({ highlights }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 mb-6 gap-3 sm:gap-x-4 sm:gap-y-5">
      {highlights.map((item, index) => {
        const hasRichData = item.title || item.description;

        return (
          <div
            key={index}
            className="flex flex-row bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-center shrink-0 bg-black w-12 sm:w-14">
              <p className="text-white transform -rotate-90 text-sm font-bold tracking-wider whitespace-nowrap">
                {String(index + 1).padStart(2, "0")}
              </p>
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-1">
              {hasRichData ? (
                <>
                  <p className="text-sm sm:text-base font-semibold text-gray-900">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                  {item.highlight || "—"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ViewHighlight;
