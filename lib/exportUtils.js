import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { getProductThumbnail, getProductName, getProductBrand, resolvePricing } from '@/lib/productUtils';

export const exportMoodboardToExcel = async (moodboard, project, products = []) => {
    // If products aren't explicitly passed, try to extract them from the moodboard's estimatedCostId.products (assigned in backend getmoodboardbyid)
    const activeProducts = products.length > 0 ? products : (moodboard?.estimatedCostId?.products || []);
    const customPhotos = (moodboard?.customPhotos || []).filter(p => !(p.tags || []).includes('Render'));
    const customRows = moodboard?.customRows || [];
    const productStatuses = moodboard?.productMetadata || {};

    const allOverviewItems = [
        ...activeProducts.map(p => ({ type: 'product', data: p })),
        ...customPhotos.map(p => ({ type: 'photo', data: p })),
        ...customRows.map(r => ({ type: 'row', data: r }))
    ];

    if (allOverviewItems.length === 0) {
        toast.error('No materials found to export');
        return;
    }

    toast.loading('Preparing excel export with images...', { id: 'export-toast' });

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Materials Export');

        // Setup Headers
        const headerRow = [
            'Product Image',
            'Name',
            'Spec Status',
            'Project Name',
            'Brand',
            'Manufacturer SKU',
            'Quantity',
            'Unit Price',
            'Total Cost'
        ];

        worksheet.getRow(1).values = headerRow;
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).height = 30;
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Set column widths
        worksheet.columns = [
            { width: 25 }, // Image
            { width: 30 }, // Name
            { width: 15 }, // Status
            { width: 20 }, // Project
            { width: 20 }, // Brand
            { width: 20 }, // SKU
            { width: 10 }, // Qty
            { width: 15 }, // Price
            { width: 15 }  // Total
        ];

        let totalSum = 0;

        for (let i = 0; i < allOverviewItems.length; i++) {
            const { type, data } = allOverviewItems[i];
            const isPhoto = type === 'photo';
            const isRow = type === 'row';
            const isProduct = type === 'product';

            const id = isProduct ? data._id : data.id;
            const meta = isProduct ? (productStatuses[id] || {}) : data;
            const st = (isPhoto || isRow) ? (data.status || 'Considering') : (typeof meta === 'object' ? meta.status : meta || 'Considering');
            let qty = (isPhoto || isRow) ? data.quantity : meta.quantity;
            qty = Number(qty) || 1;

            let price = 0;
            if (isPhoto || isRow) {
                price = Number(data.price) || 0;
            } else {
                if (typeof meta === 'object' && meta.price !== undefined) {
                    price = Number(meta.price);
                } else {
                    const { price: defaultPrice } = resolvePricing(data);
                    price = defaultPrice;
                }
            }
            const total = qty * price;
            totalSum += total;

            const currentRow = i + 2;
            const row = worksheet.getRow(currentRow);

            // Set text values
            row.getCell(2).value = isProduct ? getProductName(data) : data.title;
            row.getCell(3).value = st;
            row.getCell(4).value = project?.projectName || 'ArcMat';
            row.getCell(5).value = isProduct ? getProductBrand(data) : (isPhoto ? 'Custom Upload' : 'Custom Row');
            row.getCell(6).value = isProduct ? (data?.skucode || (typeof data?.productId === 'object' ? data?.productId?.skucode : '') || '') : '—';
            row.getCell(7).value = qty;
            row.getCell(8).value = price;
            row.getCell(9).value = total;

            row.height = isProduct || isPhoto ? 100 : 30; // Set height for image or normal for rows
            row.alignment = { vertical: 'middle', horizontal: 'center' };

            // Handle Image
            const thumbUrl = isProduct ? getProductThumbnail(data) : (isPhoto ? (data.previewUrl || '') : null);
            if (thumbUrl) {
                try {
                    const response = await fetch(thumbUrl);
                    const buffer = await response.arrayBuffer();
                    const extension = thumbUrl.split('.').pop().split('?')[0].toLowerCase() || 'png';

                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: extension === 'jpg' ? 'jpeg' : extension,
                    });

                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: currentRow - 1 },
                        ext: { width: 120, height: 120 },
                        editAs: 'oneCell'
                    });
                } catch (err) {
                    console.error('Failed to load image for row', i, err);
                    row.getCell(1).value = '(Image Failed)';
                }
            }
        }

        // Add Grand Total Row
        const totalRowIndex = allOverviewItems.length + 2;
        const totalRow = worksheet.getRow(totalRowIndex);
        totalRow.getCell(8).value = 'GRAND TOTAL';
        totalRow.getCell(8).font = { bold: true };
        totalRow.getCell(9).value = totalSum;
        totalRow.getCell(9).font = { bold: true };
        totalRow.height = 30;
        totalRow.alignment = { vertical: 'middle' };

        // Generate and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(moodboard?.moodboard_name || 'space').replace(/\s+/g, '-')}-export.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Excel exported successfully!', { id: 'export-toast' });
    } catch (error) {
        console.error('Export failed:', error);
        toast.error('Failed to export Excel', { id: 'export-toast' });
    }
};
