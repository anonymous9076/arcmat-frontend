import ExcelJS from 'exceljs';
import { toast } from 'sonner';
import { getProductThumbnail, getProductName, getProductBrand, resolvePricing } from '@/lib/productUtils';

// Professional Color Palette
const COLORS = {
    PRIMARY: 'FF2D3748', // Dark Slate
    SECONDARY: 'FF718096', // Slate Gray
    ACCENT: 'FFD9A88A', // Arcmat Beige/Gold
    WHITE: 'FFFFFFFF',
    LIGHT_BG: 'FFF7FAFC',
    BORDER: 'FFE2E8F0'
};

const STYLES = {
    headerMain: {
        font: { bold: true, size: 16, color: { argb: COLORS.PRIMARY } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } }
    },
    headerSpace: {
        font: { bold: true, size: 12, color: { argb: COLORS.WHITE } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.PRIMARY } },
        alignment: { vertical: 'middle', horizontal: 'center' }
    },
    tableHeader: {
        font: { bold: true, color: { argb: COLORS.WHITE } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.SECONDARY } },
        alignment: { vertical: 'middle', horizontal: 'center' },
        border: {
            bottom: { style: 'thin', color: { argb: COLORS.BORDER } }
        }
    },
    cellStandard: {
        alignment: { vertical: 'middle', horizontal: 'center', wrapText: true }
    },
    borderBottom: {
        border: { bottom: { style: 'thin', color: { argb: COLORS.BORDER } } }
    }
};

const appendMoodboardData = async (worksheet, moodboard, project, products = [], startRow) => {
    const activeProducts = products.length > 0 ? products : (moodboard?.estimatedCostId?.products || []);
    const customPhotos = (moodboard?.customPhotos || []).filter(p => !(p.tags || []).includes('Render'));
    const renders = (moodboard?.customPhotos || []).filter(p => (p.tags || []).includes('Render'));
    const customRows = moodboard?.customRows || [];
    const productStatuses = moodboard?.productMetadata || {};

    const allOverviewItems = [
        ...activeProducts.map(p => ({ type: 'product', data: p })),
        ...customPhotos.map(p => ({ type: 'photo', data: p })),
        ...customRows.map(r => ({ type: 'row', data: r }))
    ];

    if (allOverviewItems.length === 0) return { total: 0, nextRow: startRow };

    let currentRow = startRow;

    // 1. Space Header Row
    worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
    const spaceHeader = worksheet.getRow(currentRow);
    spaceHeader.getCell(1).value = `SPACE: ${moodboard.moodboard_name?.toUpperCase() || 'Materials'}`;
    Object.assign(spaceHeader.getCell(1), STYLES.headerSpace);
    spaceHeader.height = 35;
    currentRow++;

    // 2. Table Headers
    const tableHeader = worksheet.getRow(currentRow);
    const headers = ['Product Image', 'Name', 'Spec Status', 'Project Name', 'Brand', 'Manufacturer SKU', 'Quantity', 'Unit Price', 'Total Cost'];
    tableHeader.values = headers;
    headers.forEach((_, idx) => {
        Object.assign(tableHeader.getCell(idx + 1), STYLES.tableHeader);
    });
    tableHeader.height = 30;
    currentRow++;

    let spaceTotal = 0;
    const workbook = worksheet.workbook;

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
        spaceTotal += total;

        const row = worksheet.getRow(currentRow);
        row.getCell(2).value = isProduct ? getProductName(data) : data.title;
        row.getCell(3).value = st;
        row.getCell(4).value = project?.projectName || 'ArcMat';
        row.getCell(5).value = isProduct ? getProductBrand(data) : (isPhoto ? 'Custom Upload' : 'Custom Row');
        row.getCell(6).value = isProduct ? (data?.skucode || (typeof data?.productId === 'object' ? data?.productId?.skucode : '') || '') : '—';
        row.getCell(7).value = qty;
        row.getCell(8).value = price;
        row.getCell(9).value = total;

        // Apply cell styling and numeric formats
        [2, 3, 4, 5, 6, 7].forEach(col => {
            Object.assign(row.getCell(col), STYLES.cellStandard);
        });
        [8, 9].forEach(col => {
            row.getCell(col).numFmt = '₹#,##0.00';
            Object.assign(row.getCell(col), STYLES.cellStandard);
        });

        // Alternating row colors
        if (i % 2 !== 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
        }
        
        row.height = isProduct || isPhoto ? 100 : 35;

        // Image handling
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
                console.error('Failed to load image at row', currentRow, err);
                row.getCell(1).value = '(Image Failed)';
            }
        }
        currentRow++;
    }

    // 3. Space Total Row
    const subtotalRow = worksheet.getRow(currentRow);
    subtotalRow.getCell(8).value = `${moodboard.moodboard_name?.toUpperCase()} TOTAL`;
    subtotalRow.getCell(8).font = { bold: true, color: { argb: COLORS.PRIMARY } };
    subtotalRow.getCell(9).value = spaceTotal;
    subtotalRow.getCell(9).font = { bold: true, color: { argb: COLORS.PRIMARY } };
    subtotalRow.getCell(9).numFmt = '₹#,##0.00';
    subtotalRow.height = 30;
    subtotalRow.alignment = { vertical: 'middle', horizontal: 'right' };
    currentRow += 2;

    // 4. Renders Section (if any)
    if (renders.length > 0) {
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const renderHeader = worksheet.getRow(currentRow);
        renderHeader.getCell(1).value = `VISUAL RENDERS: ${moodboard.moodboard_name?.toUpperCase()}`;
        renderHeader.getCell(1).font = { bold: true, color: { argb: COLORS.PRIMARY } };
        renderHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        renderHeader.alignment = { horizontal: 'center', vertical: 'middle' };
        currentRow++;

        for (const render of renders) {
            const row = worksheet.getRow(currentRow);
            row.height = 120;
            row.getCell(2).value = render.title || 'Render';
            row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
            Object.assign(row.getCell(2), STYLES.cellStandard);
            
            if (render.previewUrl) {
                try {
                    const response = await fetch(render.previewUrl);
                    const buffer = await response.arrayBuffer();
                    const extension = render.previewUrl.split('.').pop().split('?')[0].toLowerCase() || 'png';
                    const imageId = workbook.addImage({
                        buffer: buffer,
                        extension: extension === 'jpg' ? 'jpeg' : extension,
                    });
                    worksheet.addImage(imageId, {
                        tl: { col: 0, row: currentRow - 1 },
                        ext: { width: 140, height: 140 },
                        editAs: 'oneCell'
                    });
                } catch (e) {
                    console.error('Render image export failed', e);
                }
            }
            currentRow++;
        }
        currentRow++;
    }

    return { total: spaceTotal, nextRow: currentRow };
};

export const exportMoodboardToExcel = async (moodboard, project, products = []) => {
    toast.loading('Preparing excel export...', { id: 'export-toast' });

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(moodboard?.moodboard_name?.substring(0, 31) || 'Materials Export');

        worksheet.columns = [
            { width: 25 }, { width: 35 }, { width: 15 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 10 }, { width: 15 }, { width: 15 }
        ];

        const { total } = await appendMoodboardData(worksheet, moodboard, project, products, 1);

        if (total === 0) {
            toast.error('No materials found to export', { id: 'export-toast' });
            return;
        }

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

export const exportProjectToExcel = async (project, moodboards = []) => {
    if (!moodboards || moodboards.length === 0) {
        toast.error('No spaces found in this project to export');
        return;
    }

    toast.loading('Preparing project-wide excel export...', { id: 'export-toast' });

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Project Export');

        worksheet.columns = [
            { width: 25 }, { width: 35 }, { width: 15 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 10 }, { width: 15 }, { width: 15 }
        ];

        // 1. Title
        let currentRow = 2;
        worksheet.mergeCells(`A${currentRow}:I${currentRow}`);
        const projectTitle = worksheet.getRow(currentRow);
        projectTitle.getCell(1).value = 'PROJECT SPECIFICATION EXPORT';
        Object.assign(projectTitle.getCell(1), STYLES.headerMain);
        projectTitle.height = 45;
        currentRow += 2;

        // 2. Summary Section
        const addSummaryRow = (label, value) => {
            worksheet.getCell(`B${currentRow}`).value = label;
            worksheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: COLORS.SECONDARY } };
            worksheet.getCell(`C${currentRow}`).value = value;
            worksheet.getCell(`C${currentRow}`).font = { bold: true, color: { argb: COLORS.PRIMARY } };
            currentRow++;
        };

        addSummaryRow('Project name', project?.projectName || 'N/A');
        addSummaryRow('Client info', project?.clientName || 'N/A');
        addSummaryRow('Current phase', project?.phase || 'N/A');
        addSummaryRow('Project status', project?.status || 'Active');
        addSummaryRow('Exported on', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
        currentRow += 2;

        // 3. Breakdown Header
        worksheet.mergeCells(`B${currentRow}:E${currentRow}`);
        const breakdownHeader = worksheet.getRow(currentRow);
        breakdownHeader.getCell(2).value = 'SUMMARY BY SPACE';
        breakdownHeader.getCell(2).font = { bold: true, color: { argb: COLORS.WHITE } };
        breakdownHeader.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ACCENT } };
        breakdownHeader.getCell(2).alignment = { horizontal: 'center' };
        breakdownHeader.height = 30;
        currentRow++;

        const subTableHeader = worksheet.getRow(currentRow);
        ['', '#', 'Space Name', 'Total Items', 'Cost (₹)'].forEach((val, idx) => {
            if (!val) return;
            const cell = subTableHeader.getCell(idx + 1);
            cell.value = val;
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
        });
        currentRow++;

        const startBreakdownRow = currentRow;
        moodboards.forEach((mb, idx) => {
            const itemsCount = mb.canvasState?.filter(item => item.type === 'material').length || 0;
            const row = worksheet.getRow(currentRow);
            row.getCell(2).value = idx + 1;
            row.getCell(3).value = mb.moodboard_name;
            row.getCell(4).value = itemsCount;
            [2, 3, 4].forEach(col => row.getCell(col).alignment = { horizontal: 'center' });
            currentRow++;
        });

        currentRow++;
        const totalRow = worksheet.getRow(currentRow);
        totalRow.getCell(3).value = 'TOTAL ESTIMATED PROJECT VALUE';
        totalRow.getCell(3).font = { bold: true, size: 12 };
        const finalCostCell = totalRow.getCell(5);
        finalCostCell.font = { bold: true, size: 13, color: { argb: COLORS.PRIMARY } };
        finalCostCell.numFmt = '₹#,##0.00';
        currentRow += 4;

        // 4. Detailed Data
        let grandTotal = 0;
        const breakdownCosts = [];

        for (let i = 0; i < moodboards.length; i++) {
            const mb = moodboards[i];
            const result = await appendMoodboardData(worksheet, mb, project, [], currentRow);
            grandTotal += result.total;
            breakdownCosts.push(result.total);
            currentRow = result.nextRow + 2;
        }

        // Fill pre-calculated costs
        for (let i = 0; i < breakdownCosts.length; i++) {
            const cell = worksheet.getRow(startBreakdownRow + i).getCell(5);
            cell.value = breakdownCosts[i];
            cell.numFmt = '₹#,##0.00';
            cell.alignment = { horizontal: 'center' };
        }
        finalCostCell.value = grandTotal;

        // Finalize
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(project?.projectName || 'project').replace(/\s+/g, '-')}-specification-report.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('Professional report generated!', { id: 'export-toast' });
    } catch (error) {
        console.error('Project export failed:', error);
        toast.error('Failed to generate professional report', { id: 'export-toast' });
    }
};

export const downloadImage = async (url, filename) => {
    if (!url) return;
    const toastId = toast.loading('Preparing download...');
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'downloaded-image.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        toast.success('Download started', { id: toastId });
    } catch (error) {
        console.error('Download failed:', error);
        toast.error('Failed to download image', { id: toastId });
    }
};
