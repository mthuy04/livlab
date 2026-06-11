import { livlabImages } from '@/lib/livlabImages';
import SafeImage from '@/components/ui/SafeImage';

export default function ImageCheckPage() {
  const imagesToCheck = [
    { name: 'Hero', path: livlabImages.hero, usage: 'Homepage hero background' },
    { name: 'Main Showcase: Visual Studio', path: livlabImages.mainShowcase.visualStudio, usage: 'Ướm thử sản phẩm section' },
    { name: 'Main Showcase: Surface Portal', path: livlabImages.mainShowcase.surfacePortal, usage: 'Bắt đầu từ phòng tắm. Mở rộng sang Home & Living section' },
    { name: 'Demo Path: Concept', path: livlabImages.demoPaths.concept, usage: 'Xem concept phòng tắm' },
    { name: 'Demo Path: Material', path: livlabImages.demoPaths.material, usage: 'Thử gạch và vật liệu' },
    { name: 'Demo Path: Showroom', path: livlabImages.demoPaths.showroom, usage: 'Showroom tư vấn trực quan' },
    { name: 'Visual Studio: Sample Room', path: livlabImages.visualStudio.sampleRoom, usage: 'Default room for visual studio' },
    { name: 'Concept Compact', path: livlabImages.concepts.compact, usage: 'Concept Card: Compact' },
    { name: 'Concept Japandi', path: livlabImages.concepts.japandi, usage: 'Concept Card: Japandi' },
    { name: 'Concept Hotel Gray', path: livlabImages.concepts.hotelGray, usage: 'Concept Card: Hotel Gray' },
    { name: 'Concept Luxury Master', path: livlabImages.concepts.luxuryMaster, usage: 'Concept Card: Luxury Master' },
    { name: 'Concept Minimal White', path: livlabImages.concepts.minimalWhite, usage: 'Concept Card: Minimal White' },
    { name: 'Concept Rental Budget', path: livlabImages.concepts.rentalBudget, usage: 'Concept Card: Rental Budget' },
  ];

  return (
    <div className="bg-[#F8FBFD] min-h-screen p-10 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-extrabold text-[#0B1623] mb-10">Image QA Check</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {imagesToCheck.map((img, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#D8E2EA] shadow-sm flex flex-col">
              <div className="aspect-video bg-[#EEF4F7] rounded-xl overflow-hidden mb-4 relative">
                <SafeImage 
                  src={img.path} 
                  alt={img.name} 
                  className="w-full h-full object-cover" 
                  fallbackLabel="Missing Image"
                />
              </div>
              <h3 className="font-bold text-[#0B1623]">{img.name}</h3>
              <p className="text-xs text-[#627386] mt-1 font-mono break-all mb-2">{img.path}</p>
              <div className="mt-auto pt-3 border-t border-[#D8E2EA]">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#123C5A]">Intended Usage:</p>
                <p className="text-sm font-medium text-[#0B1623]">{img.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
