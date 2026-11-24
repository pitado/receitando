"""Render the Receitando GanttProject history as a single landscape page."""

import argparse
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from xml.etree import ElementTree

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


DAY = timedelta(days=1)
MONTHS = (
    "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
    "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
)
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
FONT = "DejaVuSans"
BOLD = "DejaVuSans-Bold"
INK = HexColor("#192D28")
MUTED = HexColor("#4F645D")
GREEN = HexColor("#28654F")
GRID = HexColor("#D8E1DB")
MONTH_GRID = HexColor("#B2C5BA")
HEADER = HexColor("#E8F0E9")
STRIPE = HexColor("#F5F8F5")
SOURCE_URL = (
    "https://github.com/pitado/receitando/tree/"
    "docs/gantt-historico-receitando/docs/ganttproject"
)


@dataclass(frozen=True)
class Stage:
    name: str
    start: date
    end: date


def read_stages(project_path):
    task_nodes = ElementTree.parse(project_path).getroot().findall("./tasks/task")
    stages = []
    for node in task_nodes:
        start = date.fromisoformat(node.attrib["start"])
        duration = int(node.attrib["duration"])
        if duration < 1:
            raise ValueError(f"A etapa {node.attrib['name']} precisa de uma duração positiva.")
        stages.append(Stage(node.attrib["name"], start, start + DAY * (duration - 1)))
    if not stages:
        raise ValueError("O arquivo não tem etapas para exportar.")
    return stages


def as_br(value):
    return value.strftime("%d/%m/%Y")


def render(stages, output_path):
    pdfmetrics.registerFont(TTFont(FONT, str(FONT_DIR / f"{FONT}.ttf")))
    pdfmetrics.registerFont(TTFont(BOLD, str(FONT_DIR / f"{BOLD}.ttf")))

    width, height = landscape(A4)
    margin = 33
    table_right = width - margin
    table_top = height - 111
    rows_top = table_top - 39
    row_height = min(23, (rows_top - 74) / len(stages))
    if row_height < 16:
        raise ValueError("O número de etapas excede o espaço legível de uma página.")
    table_bottom = rows_top - len(stages) * row_height
    chart_left = margin + 380
    start_col = margin + 264
    end_col = margin + 331
    name_x = margin + 10
    font_size = 9.3
    label_width = start_col - name_x - 38
    if any(pdfmetrics.stringWidth(stage.name, FONT, font_size) > label_width
           for stage in stages):
        raise ValueError("Um nome de etapa excede a largura disponível na tabela.")

    start = min(stage.start for stage in stages)
    end = max(stage.end for stage in stages)
    end_limit = end + DAY
    day_width = (table_right - chart_left) / (end_limit - start).days

    def x_for(day):
        return chart_left + (day - start).days * day_width

    output_path.parent.mkdir(parents=True, exist_ok=True)
    pdf = Canvas(str(output_path), pagesize=(width, height))
    pdf.setTitle("Diagrama de Gantt do Receitando")
    pdf.setAuthor("Equipe Receitando")
    pdf.setCreator("Exportação a partir do GanttProject")
    pdf.setSubject("Histórico do projeto para Escola de TI, UniCesumar")

    pdf.setFillColor(GREEN)
    pdf.setFont(BOLD, 9)
    pdf.drawString(margin, height - 39, "UNICESUMAR  /  ADS  /  ESCOLA DE TI")

    pdf.setFillColor(INK)
    pdf.setFont(BOLD, 25)
    pdf.drawString(margin, height - 69, "Diagrama de Gantt do Receitando")
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT, 11)
    pdf.drawString(margin, height - 91,
                   f"Histórico do projeto  •  {as_br(start)} a {as_br(end)}")

    pdf.setFillColor(HEADER)
    pdf.rect(margin, rows_top, table_right - margin, table_top - rows_top, fill=1, stroke=0)
    pdf.setFillColor(INK)
    pdf.setFont(BOLD, 9)
    heading_y = rows_top + 16
    pdf.drawString(name_x, heading_y, "Etapa")
    pdf.drawCentredString(start_col, heading_y + 6, "Primeiro")
    pdf.drawCentredString(end_col, heading_y + 6, "Último")
    pdf.drawCentredString(start_col, heading_y - 7, "registro")
    pdf.drawCentredString(end_col, heading_y - 7, "registro")

    for row_i in range(len(stages)):
        if row_i % 2 == 0:
            pdf.setFillColor(STRIPE)
            pdf.rect(margin, rows_top - (row_i + 1) * row_height,
                     table_right - margin, row_height, fill=1, stroke=0)

    pdf.setStrokeColor(GRID)
    pdf.setLineWidth(0.45)
    for row_i in range(len(stages) + 1):
        y = rows_top - row_i * row_height
        pdf.line(margin, y, table_right, y)

    month = start
    while month < end_limit:
        next_month = (month.replace(day=28) + DAY * 4).replace(day=1)
        left = x_for(month)
        right = x_for(min(next_month, end_limit))
        pdf.setStrokeColor(MONTH_GRID)
        pdf.setLineWidth(0.6)
        pdf.line(left, table_bottom, left, table_top)
        pdf.setFillColor(INK)
        pdf.setFont(BOLD, 9)
        pdf.drawCentredString((left + right) / 2, rows_top + 24, MONTHS[month.month - 1])
        week = month
        while week <= end and week < next_month:
            x = x_for(week)
            if x + 14 <= right:
                if week != month:
                    pdf.setStrokeColor(GRID)
                    pdf.setLineWidth(0.45)
                    pdf.line(x, table_bottom, x, rows_top + 17)
                pdf.setFont(FONT, 8)
                pdf.setFillColor(MUTED)
                pdf.drawString(x + 3, rows_top + 4, f"{week.day:02d}")
            week += DAY * 7
        month = next_month

    pdf.setStrokeColor(MONTH_GRID)
    pdf.line(table_right, table_bottom, table_right, table_top)
    pdf.line(chart_left, rows_top + 17, table_right, rows_top + 17)

    for row_i, stage in enumerate(stages):
        mid = rows_top - (row_i + 0.5) * row_height
        pdf.setFillColor(INK)
        pdf.setFont(FONT, font_size)
        pdf.drawString(name_x, mid - 3.2, stage.name)
        pdf.setFillColor(MUTED)
        pdf.drawCentredString(start_col, mid - 3.2, as_br(stage.start))
        pdf.drawCentredString(end_col, mid - 3.2, as_br(stage.end))

        bar_start = x_for(stage.start)
        bar_end = x_for(stage.end + DAY)
        pdf.setFillColor(GREEN)
        pdf.roundRect(bar_start, mid - 4.5, bar_end - bar_start, 9,
                      min(3, (bar_end - bar_start) / 2), fill=1, stroke=0)

    note_y = table_bottom - 20
    pdf.setFillColor(MUTED)
    pdf.setFont(FONT, 9)
    pdf.drawString(margin, note_y,
                   "Cada barra vai do primeiro ao último registro da etapa no GitHub.")
    pdf.drawString(margin, note_y - 15,
                   "As datas usam os merges na main e os commits iniciais, no horário de Brasília.")

    link = "Evidências por etapa no GitHub"
    link_size = 9
    pdf.setFillColor(GREEN)
    pdf.setFont(BOLD, link_size)
    pdf.drawRightString(table_right, note_y, link)
    link_width = pdfmetrics.stringWidth(link, BOLD, link_size)
    pdf.linkURL(SOURCE_URL, (table_right - link_width, note_y - 2, table_right, note_y + 10))

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("projeto", type=Path)
    parser.add_argument("pdf", type=Path)
    args = parser.parse_args()
    render(read_stages(args.projeto), args.pdf)
