import * as XLSX from 'xlsx';

// Базовые стили для обычных ячеек
const cellStyle = {
  font: {
    color: {rgb: "000000"},
    sz: 11,
    name: "Arial"
  },
  alignment: {
    horizontal: "left",
    vertical: "center",
    wrapText: true
  },
  border: {
    top: {style: "thin", color: {rgb: "E5E7EB"}},
    bottom: {style: "thin", color: {rgb: "E5E7EB"}},
    left: {style: "thin", color: {rgb: "E5E7EB"}},
    right: {style: "thin", color: {rgb: "E5E7EB"}}
  }
};

// Стиль для числовых ячеек
const numericCellStyle = {
  ...cellStyle,
  alignment: {
    ...cellStyle.alignment,
    horizontal: "right"
  }
};

// Стиль для заголовков
const headerStyle = {
  fill: {
    patternType: "solid",
    fgColor: {rgb: "7C3AED"}
  },
  font: {
    bold: true,
    color: {rgb: "FFFFFF"},
    sz: 12,
    name: "Arial"
  },
  alignment: {
    horizontal: "center",
    vertical: "center",
    wrapText: true
  },
  border: {
    top: {style: "thin", color: {rgb: "E5E7EB"}},
    bottom: {style: "thin", color: {rgb: "E5E7EB"}},
    left: {style: "thin", color: {rgb: "E5E7EB"}},
    right: {style: "thin", color: {rgb: "E5E7EB"}}
  }
};

// Стиль для подзаголовков
const subHeaderStyle = {
  ...headerStyle,
  fill: {
    patternType: "solid",
    fgColor: {rgb: "9747FF"}
  }
};

interface ColumnConfig {
  width: number;
  style?: any;
}

interface SheetConfig {
  headerRows: number[];
  subHeaderRows: number[];
  columns: ColumnConfig[];
}

const REPORT_CONFIGS: Record<string, SheetConfig> = {
  sales: {
    headerRows: [0, 5, 8, 12, 16],
    subHeaderRows: [9, 13, 17],
    columns: [
      { width: 15 }, // №
      { width: 10 }, // Стол
      { width: 20 }, // Дата
      { width: 25 }, // Официант
      { width: 25 }, // Кассир
      { width: 20 }, // Способ оплаты
      { width: 15, style: numericCellStyle } // Сумма
    ]
  },
  inventory: {
    headerRows: [0],
    subHeaderRows: [1],
    columns: [
      { width: 30 }, // Ингредиент
      { width: 15 }, // Ед. изм.
      { width: 15, style: numericCellStyle }, // На складе
      { width: 15, style: numericCellStyle }, // Поставки
      { width: 15, style: numericCellStyle }  // Списания
    ]
  },
  employees: {
    headerRows: [0, 3, 7],
    subHeaderRows: [4],
    columns: [
      { width: 30 }, // Сотрудник/Информация
      { width: 20 }  // Роль/Значение
    ]
  },
  'popular-items': {
    headerRows: [0],
    subHeaderRows: [1],
    columns: [
      { width: 30 }, // Название
      { width: 20, style: numericCellStyle }, // Количество продаж
      { width: 15, style: numericCellStyle }, // Цена
      { width: 20, style: numericCellStyle }  // Выручка
    ]
  }
};

export function createStyledWorksheet(data: any[][], reportType: string) {
  const config = REPORT_CONFIGS[reportType];
  if (!config) {
    throw new Error(`Неизвестный тип отчета: ${reportType}`);
  }

  // Преобразуем данные, добавляя стили к каждой ячейке
  const styledData = data.map((row, rowIndex) => {
    return row.map((cell, colIndex) => {
      let style = config.columns[colIndex]?.style || cellStyle;

      // Определяем стиль на основе типа строки
      if (config.headerRows.includes(rowIndex)) {
        style = headerStyle;
      } else if (config.subHeaderRows.includes(rowIndex)) {
        style = subHeaderStyle;
      }

      // Для числовых значений используем числовой формат
      const isNumber = typeof cell === 'number' || (!isNaN(cell) && cell.toString().trim() !== '');

      return {
        v: cell, // значение
        t: isNumber ? 'n' : 's', // тип (число или строка)
        s: style // стиль
      };
    });
  });

  // Создаем лист
  const ws = XLSX.utils.aoa_to_sheet(styledData);

  // Устанавливаем ширину столбцов из конфигурации
  ws['!cols'] = config.columns.map(col => ({ wch: col.width }));

  // Устанавливаем высоту строк
  ws['!rows'] = styledData.map((_, index) => ({
    hpt: config.headerRows.includes(index) || config.subHeaderRows.includes(index) ? 30 : 25
  }));

  return ws;
}

/**
 * Создает и скачивает Excel файл с данными отчета
 * @param data Данные для записи в Excel
 * @param sheetName Название листа
 * @param fileName Имя файла
 */
export function createAndDownloadExcel(data: any[][], sheetName: string, fileName: string) {
  // Создаем новую книгу
  const workbook = XLSX.utils.book_new();

  // Создаем лист с данными
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Устанавливаем ширину столбцов
  const maxWidth = 20;
  const colWidths = data[0].map(() => ({ wch: maxWidth }));
  worksheet['!cols'] = colWidths;

  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Сохраняем файл
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
} 
 