---
name: skill-excel
description: "Trigger khi làm việc với file Excel (.xlsx) — đọc, ghi, format, validate data trong Excel. Xử lý mọi thao tác với workbook."
---

## TRIGGER
- File input/output: `.xlsx`, `.xls`
- Từ khóa: "đọc Excel", "ghi Excel", "format sheet", "validate data", "import/export"
- Cần parse BOQ_Template.xlsx hoặc Item_Master.xlsx

## WORKFLOW
1. **Read** → `excel_excel_read_sheet` với range cụ thể
2. **Validate** → check data types, null values, duplicates
3. **Process** → transform/formula/calculation
4. **Write** → `excel_excel_write_to_sheet` với style保留
5. **Format** → `excel_excel_format_range` nếu cần style

## CONVENTIONS
- Luôn dùng `fileAbsolutePath` (không dùng relative path)
- Check sheet name trước khi read/write (`excel_excel_describe_sheets`)
- Paginate khi read sheet lớn (>2000 rows)
- Giữ nguyên formula khi write (không convert thành value)
- Validate data trước khi write (tránh corrupt workbook)

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Sheet không tồn tại | Tạo mới với `newSheet: true` |
| Range trống | Check null cells, skip hoặc default value |
| Formula error (#REF!, #N/A) | Flag lỗi, không silently replace |
| merged cells | Read cell đầu tiên, skip merged range |

## CHECKLIST
- [ ] File path đúng (absolute)
- [ ] Sheet name tồn tại
- [ ] Data types consistent trong column
- [ ] Không ghi đè data quan trọng mà chưa confirm
