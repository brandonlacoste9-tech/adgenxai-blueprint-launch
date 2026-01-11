import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, X, Sparkles } from 'lucide-react';

interface BrandAnalysis {
  primaryColor: string;
  secondaryColor: string;
  fontVibe: string;
  brandArchetype: string;
  canadianElements: string[];
}

interface BrandUploaderProps {
  onBrandAnalyzed: (analysis: BrandAnalysis, imageData: string) => void;
  currentAnalysis?: BrandAnalysis;
  isAnalyzing?: boolean;
}

const BrandUploader: React.FC<BrandUploaderProps> = ({
  onBrandAnalyzed,
  currentAnalysis,
  isAnalyzing = false
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      setIsProcessing(true);

      try {
        // Call the brand analysis function
        const analysis = await analyzeBrandImage(base64);
        onBrandAnalyzed(analysis, base64);
      } catch (error) {
        console.error('Brand analysis failed:', error);
        alert('Failed to analyze brand image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onBrandAnalyzed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: isAnalyzing || isProcessing
  });

  const analyzeBrandImage = async (imageData: string): Promise<BrandAnalysis> => {
    // This would call your Vertex AI function for brand analysis
    // For now, return mock data based on Modern Voyageur theme
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          primaryColor: '#3d2b1f', // Deep Cognac Leather
          secondaryColor: '#d4af37', // Brushed Gold
          fontVibe: 'Heritage-Serif',
          brandArchetype: 'The Explorer',
          canadianElements: ['Northern landscapes', 'Maple leaf motifs', 'Heritage craftsmanship']
        });
      }, 2000); // Simulate processing time
    });
  };

  const removeImage = () => {
    setUploadedImage(null);
    // Reset analysis if needed
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-voyageur-gold" />
          <h3 className="text-lg font-semibold">Brand DNA Extractor</h3>
          {currentAnalysis && (
            <Badge variant="outline" className="text-voyageur-gold border-voyageur-gold">
              <Sparkles className="w-3 h-3 mr-1" />
              Analyzed
            </Badge>
          )}
        </div>
        <p className="text-sm text-white/60">
          Upload a photo of your brand/storefront to extract colors and style automatically
        </p>
      </CardHeader>
      <CardContent>
        {!uploadedImage ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-voyageur-gold bg-voyageur-gold/10'
                : 'border-white/20 hover:border-voyageur-gold/50'
            } ${isAnalyzing || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
            <h4 className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop your brand image here' : 'Upload Brand Image'}
            </h4>
            <p className="text-sm text-white/60 mb-4">
              Drag & drop or click to select a photo of your storefront, products, or brand assets
            </p>
            <div className="text-xs text-white/40">
              Supports: JPG, PNG, GIF, WebP (max 5MB)
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded brand asset"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 p-4 bg-voyageur-gold/10 rounded-lg">
                <div className="animate-spin w-4 h-4 border-2 border-voyageur-gold border-t-transparent rounded-full"></div>
                <span className="text-sm">Analyzing brand DNA...</span>
              </div>
            )}

            {currentAnalysis && !isProcessing && (
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <h4 className="font-medium text-voyageur-gold">Extracted Brand DNA:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Primary Color:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: currentAnalysis.primaryColor }}
                      ></div>
                      <span className="font-mono">{currentAnalysis.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Secondary Color:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div
                        className="w-4 h-4 rounded border border-white/20"
                        style={{ backgroundColor: currentAnalysis.secondaryColor }}
                      ></div>
                      <span className="font-mono">{currentAnalysis.secondaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/60">Typography:</span>
                    <p className="mt-1">{currentAnalysis.fontVibe}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Archetype:</span>
                    <p className="mt-1">{currentAnalysis.brandArchetype}</p>
                  </div>
                </div>
                <div>
                  <span className="text-white/60 text-sm">Canadian Elements:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentAnalysis.canadianElements.map((element, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {element}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setUploadedImage(null)}
              className="w-full"
              disabled={isProcessing}
            >
              Upload Different Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BrandUploader;