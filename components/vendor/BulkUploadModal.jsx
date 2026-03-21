'use client';

import { useState } from 'react';
import { useBulkImportProduct, useGetProducts } from '@/hooks/useProduct';
import { toast } from '@/components/ui/Toast';
import { X, Upload, FileText, CheckCircle, AlertCircle, Package, Layers, Download, ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useUIStore } from '@/store/useUIStore';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { productService } from '@/services/productService';

export default function BulkUploadModal() {
  const { isBulkUploadModalOpen, closeBulkUploadModal } = useUIStore();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [zipFile, setZipFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [importType, setImportType] = useState('product');
  const [imageUploadComplete, setImageUploadComplete] = useState(false);
  const [productUploadComplete, setProductUploadComplete] = useState(false);

  const bulkImportMutation = useBulkImportProduct();

  const handleZipFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.zip')) {
        setZipFile(selectedFile);
      } else {
        toast.error('Please upload a valid ZIP file');
      }
    }
  };

  const handleCsvFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (validTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith('.csv') ||
        selectedFile.name.endsWith('.xlsx')) {
        setCsvFile(selectedFile);
        setResult(null);
      } else {
        toast.error('Please upload a valid CSV or Excel file');
      }
    }
  };

  const handleZipUpload = async () => {
    if (!zipFile) return;

    setIsUploading(true);
    try {
      const response = await productService.bulkImageUpload(zipFile);
      toast.success(`Successfully uploaded ${response.data.uploadedCount} images`);
      setImageUploadComplete(true);
      setCurrentStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    try {
      const response = await bulkImportMutation.mutateAsync({
        file: csvFile,
        type: 'product'
      });
      setResult(response.data);
      toast.success('Products imported successfully');
      setProductUploadComplete(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload products');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVariantUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    try {
      const response = await bulkImportMutation.mutateAsync({
        file: csvFile,
        type: 'variant'
      });
      setResult(response.data);
      toast.success('Variants imported successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload variants');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSkipReport = () => {
    if (!result || !result.details || !result.details.skipped || result.details.skipped.length === 0) {
      toast.error('No skip report available');
      return;
    }

    const skipData = result.details.skipped;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(skipData);
    XLSX.utils.book_append_sheet(wb, ws, "Skip Report");
    XLSX.writeFile(wb, `Skip_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Skip report downloaded');
  };

  const handleClose = () => {
    setCurrentStep(1);
    setZipFile(null);
    setCsvFile(null);
    setResult(null);
    setImportType('product');
    setImageUploadComplete(false);
    setProductUploadComplete(false);
    closeBulkUploadModal();
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      setCsvFile(null);
    }
  };

  if (!isBulkUploadModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-[#e09a74]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bulk Import Hub</h2>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Step-by-step upload process</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-center gap-2">
            {[
              { num: 1, label: 'Images', icon: ImageIcon },
              { num: 2, label: 'Products', icon: Package },
              { num: 3, label: 'Variants', icon: Layers }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    currentStep === step.num ? "bg-[#e09a74] text-white shadow-md" :
                      currentStep > step.num ? "bg-green-500 text-white" :
                        "bg-gray-200 text-gray-500"
                  )}>
                    {currentStep > step.num ? <CheckCircle className="w-4 h-4" /> : step.num}
                  </div>
                  <span className={clsx(
                    "text-sm font-semibold",
                    currentStep >= step.num ? "text-gray-900" : "text-gray-400"
                  )}>
                    {step.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={clsx(
                    "w-12 h-0.5 mx-3",
                    currentStep > step.num ? "bg-green-500" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result ? (
            <>
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-[#e09a74]" />
                    <h3 className="text-lg font-bold text-gray-900">Step 1: Upload Product Images (ZIP)</h3>
                  </div>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-100/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      onChange={handleZipFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept=".zip"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <FileText className="w-7 h-7 text-[#e09a74]" />
                      </div>
                      {zipFile ? (
                        <div className="flex flex-col items-center">
                          <span className="text-md font-bold text-gray-900 truncate max-w-[250px]">{zipFile.name}</span>
                          <span className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-3 py-1 rounded-full">File Ready</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-900">Drop your ZIP file here or click to browse</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">ZIP format only</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold text-orange-900 mb-1">Important</p>
                        <ul className="space-y-1 text-orange-800/80 text-[13px] font-medium">
                          <li>• ZIP file should contain all product/variant images</li>
                          <li>• Supported formats: JPG, PNG, GIF, WEBP</li>
                          <li>• All existing brand images will be replaced</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleZipUpload}
                    disabled={!zipFile || isUploading}
                    className="w-full bg-[#e09a74] text-white py-3.5 rounded-lg font-bold hover:bg-[#d08963] disabled:opacity-50 shadow-lg shadow-orange-100"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Uploading Images...
                      </div>
                    ) : (
                      'Upload Images & Continue'
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-[#e09a74]" />
                    <h3 className="text-lg font-bold text-gray-900">Step 2: Upload Products (CSV/Excel)</h3>
                  </div>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-100/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      onChange={handleCsvFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept=".csv, .xlsx, .xls"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <FileText className="w-7 h-7 text-[#e09a74]" />
                      </div>
                      {csvFile ? (
                        <div className="flex flex-col items-center">
                          <span className="text-md font-bold text-gray-900 truncate max-w-[250px]">{csvFile.name}</span>
                          <span className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-3 py-1 rounded-full">File Ready</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-900">Drop your file here or click to browse</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Excel or CSV formats supported</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold text-orange-900 mb-1">Product Import Guidelines</p>
                        <ul className="space-y-1 text-orange-800/80 text-[13px] font-medium">
                          <li>• All three category levels (L1, L2, L3) are required</li>
                          <li>• Brand ID or Brand Name is required</li>
                          <li>• Unique Code and Product URL are mandatory (and must be unique)</li>
                          <li>• Image names in CSV should match uploaded ZIP files from Step 1</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCsvUpload}
                    disabled={!csvFile || isUploading}
                    className="w-full bg-[#e09a74] text-white py-3.5 rounded-lg font-bold hover:bg-[#d08963] disabled:opacity-50 shadow-lg shadow-orange-100"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing File...
                      </div>
                    ) : (
                      'Import Products & Continue'
                    )}
                  </Button>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-[#e09a74]" />
                    <h3 className="text-lg font-bold text-gray-900">Step 3: Upload Variants (Optional)</h3>
                  </div>

                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-100/50 transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      onChange={handleCsvFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept=".csv, .xlsx, .xls"
                    />
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all">
                        <FileText className="w-7 h-7 text-[#e09a74]" />
                      </div>
                      {csvFile ? (
                        <div className="flex flex-col items-center">
                          <span className="text-md font-bold text-gray-900 truncate max-w-[250px]">{csvFile.name}</span>
                          <span className="text-xs text-green-600 font-bold mt-1 bg-green-50 px-3 py-1 rounded-full">File Ready</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-gray-900">Drop your file here or click to browse</p>
                          <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">Excel or CSV formats supported</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-bold text-orange-900 mb-1">Variant Import Guidelines</p>
                        <ul className="space-y-1 text-orange-800/80 text-[13px] font-medium">
                          <li>• Unique Code is required to map variants</li>
                          <li>• Variant SKU Code must be unique</li>
                          <li>• Attributes format: "Size: XL | Color: Red"</li>
                          <li>• Variants will be linked automatically via Unique Code</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleClose}
                      className="flex-1 bg-gray-200 text-gray-700 py-3.5 rounded-lg font-bold hover:bg-gray-300"
                    >
                      Skip & Finish
                    </Button>
                    <Button
                      onClick={handleVariantUpload}
                      disabled={!csvFile || isUploading}
                      className="flex-1 bg-[#e09a74] text-white py-3.5 rounded-lg font-bold hover:bg-[#d08963] disabled:opacity-50 shadow-lg shadow-orange-100"
                    >
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        'Import Variants'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Complete</h3>
              <p className="text-sm text-gray-600 mb-6 px-4">{result.message}</p>

              <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sync Summary</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Successfully Added</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">{result.details.success} items</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Failed / Skipped</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">{result.details.failed} rows</span>
                  </div>
                </div>

                {result.details.errors && result.details.errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold text-red-500 mb-2">Error Logs:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                      {result.details.errors.map((err, idx) => (
                        <p key={idx} className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded flex items-start gap-2">
                          <span className="shrink-0">•</span>
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {result.details.skipped && result.details.skipped.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-orange-600">Skip Report ({result.details.skipped.length} items)</p>
                      <button
                        onClick={handleDownloadSkipReport}
                        className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                      {result.details.skipped.slice(0, 5).map((skip, idx) => (
                        <div key={idx} className="text-[11px] bg-orange-50 p-2 rounded border border-orange-100">
                          <p className="font-bold text-orange-900">
                            {importType === 'product'
                              ? `${skip.productName || 'Unknown'} (SKU: ${skip.sku || 'N/A'})`
                              : `Variant SKU: ${skip.variantSKU || 'N/A'} (Base: ${skip.baseSKU || 'N/A'})`
                            }
                          </p>
                          <p className="text-orange-700 mt-0.5">Reason: {skip.reason}</p>
                        </div>
                      ))}
                      {result.details.skipped.length > 5 && (
                        <p className="text-[10px] text-gray-500 text-center pt-1">
                          + {result.details.skipped.length - 5} more items (download full report)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {result && currentStep === 2 ? (
                <div className="flex gap-3">
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300"
                  >
                    Skip & Finish
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep(3);
                      setCsvFile(null);
                      setResult(null);
                    }}
                    className="flex-1 bg-[#e09a74] text-white py-3 rounded-lg font-bold hover:bg-[#d08963]"
                  >
                    Continue to Variants
                  </Button>
                </div>
              ) : result && currentStep === 3 ? (
                <Button
                  onClick={handleClose}
                  className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors"
                >
                  Close & View Updates
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}