---
name: skill-ui-design
description: "Trigger khi cần design token, dark minimalist theme, component style guide. Quản lý visual consistency của toàn bộ UI."
---

## TRIGGER
- Từ khóa: "theme", "color", "font", "spacing", "dark mode", "style guide"
- Task: tạo/sửa design tokens, theme configuration, component styles
- File: theme files, CSS variables, Ant Design config

## DESIGN TOKENS
```
Primary:    #1890FF (Ant Design default) hoặc custom
Background: #141414 (dark) / #FFFFFF (light)
Surface:    #1F1F1F (dark) / #F5F5F5 (light)
Text:       #FFFFFF (dark) / #000000 (light)
Border:     #303030 (dark) / #D9D9D9 (light)
Error:      #FF4D4F
Success:    #52C41A
Warning:    #FAAD14
Info:       #1890FF
```

## ANTD DESIGN CONFIG
- Component: `<ConfigProvider theme={{ ... }}>`
- Dark mode: `algorithm: theme.darkAlgorithm`
- Token: `colorPrimary`, `borderRadius`, `fontSize`

## COMPONENT STYLE GUIDE
- Button: consistent height (32px normal, 24px small, 40px large)
- Input: consistent padding (4px 11px)
- Card: border-radius 8px, shadow 0 1px 2px rgba(0,0,0,0.03)
- Table: striped rows, hover highlight
- Modal: centered, max-width 600px

## WORKFLOW
1. **Define tokens** → colors, fonts, spacing
2. **Configure Ant Design** → theme object trong ConfigProvider
3. **Create CSS variables** → :root hoặc dark mode
4. **Apply to components** → dùng tokens, không hardcode
5. **Verify** → check pages consistency

## EDGE CASES
| Tình huống | Xử lý |
|-----------|-------|
| Dynamic theme | Store preference trong localStorage |
| Mixed themes | Use Ant Design ConfigProvider per section |
| Custom component | Extend Ant Design style, không override |
| Responsive | Mobile-first, breakpoints: 576px, 768px, 992px, 1200px |

## CHECKLIST
- [ ] Dark mode toggle works
- [ ] All colors từ tokens (không hardcode)
- [ ] Fonts consistent (Inter hoặc system font)
- [ ] Spacing scale consistent (4px base unit)
- [ ] Responsive trên all breakpoints
