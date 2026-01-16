import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BrandStats, Mention, TopicResult, AIAnalysis } from './api';

interface ReportData {
    brandName: string;
    generatedAt: string;
    stats: BrandStats | null;
    mentions: Mention[];
    topics: TopicResult[];
    analysis: AIAnalysis | null;
}

export async function generatePDFReport(data: ReportData): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Helper functions
    const addTitle = (text: string, size: number = 20) => {
        doc.setFontSize(size);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.setFont('helvetica', 'bold');
        doc.text(text, 14, yPos);
        yPos += size * 0.5 + 8;
    };

    const addSubtitle = (text: string) => {
        doc.setFontSize(11);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'normal');
        doc.text(text, 14, yPos);
        yPos += 8;
    };

    const addSectionTitle = (text: string) => {
        yPos += 8;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.setFont('helvetica', 'bold');
        doc.text(text, 14, yPos);
        yPos += 10;
    };

    const addText = (text: string, color: number[] = [71, 85, 105]) => {
        doc.setFontSize(10);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, pageWidth - 28);
        doc.text(lines, 14, yPos);
        yPos += lines.length * 5 + 5;
    };

    const checkPageBreak = (neededSpace: number = 40) => {
        if (yPos > doc.internal.pageSize.getHeight() - neededSpace) {
            doc.addPage();
            yPos = 20;
        }
    };

    // Draw horizontal line separator
    const drawLine = () => {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, yPos, pageWidth - 14, yPos);
        yPos += 8;
    };

    // ========== HEADER ==========
    // Draw header background
    doc.setFillColor(249, 250, 251); // gray-50
    doc.rect(0, 0, pageWidth, 50, 'F');

    addTitle('BrandPulse Analytics Report', 22);
    addSubtitle(`Brand: ${data.brandName}`);
    addSubtitle(`Generated: ${data.generatedAt}`);
    yPos += 5;
    drawLine();

    // ========== EXECUTIVE SUMMARY ==========
    addSectionTitle('Executive Summary');

    if (data.stats) {
        const summaryData = [
            ['Total Mentions', data.stats.totalMentions.toString()],
            ['Positive Mentions', data.stats.positiveMentions.toString()],
            ['Negative Mentions', data.stats.negativeMentions.toString()],
            ['Neutral Mentions', data.stats.neutralMentions.toString()],
            ['Average Sentiment', `${data.stats.avgSentiment}%`],
            ['Total Reach', data.stats.reach.toLocaleString()],
            ['Active Alerts', data.stats.activeCrises.toString()],
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: {
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 4,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 4,
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { halign: 'right', cellWidth: 50 },
            },
            margin: { left: 14, right: 14 },
            tableWidth: 120,
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // ========== AI ANALYSIS ==========
    checkPageBreak(60);
    addSectionTitle('AI-Powered Analysis');

    if (data.analysis) {
        // Summary box
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(14, yPos - 2, pageWidth - 28, 30, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'normal');
        const summaryLines = doc.splitTextToSize(data.analysis.summary || 'No AI analysis available.', pageWidth - 36);
        doc.text(summaryLines, 18, yPos + 5);
        yPos += 35;

        // Sentiment trend
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129); // emerald
        doc.setFont('helvetica', 'bold');
        doc.text(`Sentiment Trend: ${data.analysis.sentimentShift || 'Stable'}`, 14, yPos);
        yPos += 8;

        // Key topics
        if (data.analysis.topTopics && data.analysis.topTopics.length > 0) {
            doc.setTextColor(79, 70, 229);
            doc.text(`Key Topics: ${data.analysis.topTopics.join(', ')}`, 14, yPos);
            yPos += 10;
        }
    } else {
        addText('AI analysis not available for this brand.');
    }

    // ========== TRENDING TOPICS ==========
    checkPageBreak(60);
    addSectionTitle('Trending Topics');

    if (data.topics && data.topics.length > 0) {
        const topicsData = data.topics.slice(0, 10).map((topic, index) => [
            (index + 1).toString(),
            topic.topic,
            topic.count.toString(),
            topic.sentiment.charAt(0).toUpperCase() + topic.sentiment.slice(1),
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Topic', 'Mentions', 'Sentiment']],
            body: topicsData,
            theme: 'grid',
            headStyles: {
                fillColor: [139, 92, 246], // purple-500
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 4,
            },
            bodyStyles: {
                fontSize: 10,
                cellPadding: 4,
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 80 },
                2: { cellWidth: 30, halign: 'center' },
                3: { cellWidth: 35, halign: 'center' },
            },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
        doc.setFillColor(254, 243, 199); // amber-100
        doc.roundedRect(14, yPos - 2, pageWidth - 28, 20, 3, 3, 'F');
        doc.setTextColor(146, 64, 14); // amber-800
        doc.setFontSize(10);
        doc.text('No trending topics extracted yet. Run AI analysis to extract topics.', 18, yPos + 6);
        yPos += 25;
    }

    // ========== RECENT MENTIONS ==========
    checkPageBreak(60);
    addSectionTitle('Recent Mentions');

    if (data.mentions && data.mentions.length > 0) {
        const mentionsData = data.mentions.slice(0, 20).map((mention) => {
            const sentiment = mention.sentiment || 'neutral';
            const source = mention.source === 'hn' ? 'Hacker News' :
                mention.source === 'rss' ? 'Google News' :
                    mention.source.charAt(0).toUpperCase() + mention.source.slice(1);
            const date = new Date(mention.publishedAt).toLocaleDateString();

            // Clean title - remove emojis and special characters
            const cleanTitle = mention.title
                .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // emojis
                .replace(/[\u{2600}-\u{26FF}]/gu, '') // misc symbols
                .replace(/[\u{2700}-\u{27BF}]/gu, '') // dingbats
                .replace(/[^\x00-\x7F]/g, '') // non-ASCII
                .trim();

            const truncatedTitle = cleanTitle.length > 55 ? cleanTitle.substring(0, 55) + '...' : cleanTitle;

            return [
                source,
                truncatedTitle,
                sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
                date,
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Source', 'Title', 'Sentiment', 'Date']],
            body: mentionsData,
            theme: 'grid',
            headStyles: {
                fillColor: [59, 130, 246], // blue-500
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 3,
            },
            bodyStyles: {
                fontSize: 8,
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251],
            },
            columnStyles: {
                0: { cellWidth: 28, fontStyle: 'bold' },
                1: { cellWidth: 100 },
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 22, halign: 'center' },
            },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
        addText('No mentions found for this brand.');
    }

    // ========== FOOTER ==========
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, doc.internal.pageSize.getHeight() - 15, pageWidth - 14, doc.internal.pageSize.getHeight() - 15);

        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(
            `Page ${i} of ${pageCount}`,
            14,
            doc.internal.pageSize.getHeight() - 8
        );
        doc.text(
            'Generated by BrandPulse',
            pageWidth - 14,
            doc.internal.pageSize.getHeight() - 8,
            { align: 'right' }
        );
    }

    // ========== SAVE ==========
    const fileName = `BrandPulse_${data.brandName.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}
