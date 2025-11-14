$content = Get-Content 'C:\Users\USER\Desktop\projects\dalreamarket.com\src\app\platform\profile\page.tsx'
$before = $content[0..1425]
$after = $content[2059..($content.Length-1)]
$newContent = $before + $after
$newContent | Set-Content 'C:\Users\USER\Desktop\projects\dalreamarket.com\src\app\platform\profile\page.tsx' -Encoding UTF8
