# Recorta as margens transparentes dos logos e grava as versões otimizadas em assets/.
# Uso, na raiz do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts/recortar-logos.ps1
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$pastaOrigem = Join-Path $raiz 'assets\originais'
$pastaDestino = Join-Path $raiz 'assets'
$margem = 6

function Recortar {
  param([string]$Entrada, [string]$CaminhoSaida, [bool]$Quadrado)

  $fonte = New-Object System.Drawing.Bitmap($Entrada)
  try {
    $minX = $fonte.Width; $minY = $fonte.Height; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $fonte.Height; $y++) {
      for ($x = 0; $x -lt $fonte.Width; $x++) {
        if ($fonte.GetPixel($x, $y).A -gt 16) {
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }
    if ($maxX -lt 0) { throw "Imagem sem conteudo visivel: $Entrada" }

    $minX = [Math]::Max(0, $minX - $margem)
    $minY = [Math]::Max(0, $minY - $margem)
    $maxX = [Math]::Min($fonte.Width - 1, $maxX + $margem)
    $maxY = [Math]::Min($fonte.Height - 1, $maxY + $margem)
    $largura = $maxX - $minX + 1
    $altura = $maxY - $minY + 1

    if ($Quadrado) {
      $telaL = [Math]::Max($largura, $altura)
      $telaA = $telaL
    } else {
      $telaL = $largura
      $telaA = $altura
    }
    $dx = [int][Math]::Floor(($telaL - $largura) / 2)
    $dy = [int][Math]::Floor(($telaA - $altura) / 2)

    $imagemFinal = New-Object System.Drawing.Bitmap($telaL, $telaA, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($imagemFinal)
      try {
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $destino = [System.Drawing.Rectangle]::new($dx, $dy, $largura, $altura)
        $origem = [System.Drawing.Rectangle]::new($minX, $minY, $largura, $altura)
        $g.DrawImage($fonte, $destino, $origem, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $g.Dispose() }
      $imagemFinal.Save($CaminhoSaida, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $imagemFinal.Dispose() }
    Write-Host ("{0}: {1}x{2} -> {3}x{4}" -f (Split-Path $Entrada -Leaf), $fonte.Width, $fonte.Height, $telaL, $telaA)
  } finally { $fonte.Dispose() }
}

Recortar (Join-Path $pastaOrigem 'Logo do jornal da escola.png') (Join-Path $pastaDestino 'logo-jornal.png') $false
Recortar (Join-Path $pastaOrigem 'Logo da escola.png') (Join-Path $pastaDestino 'logo-escola.png') $false
Recortar (Join-Path $pastaOrigem '1000189664-removebg-preview.png') (Join-Path $pastaDestino 'icone.png') $true
