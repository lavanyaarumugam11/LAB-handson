from fpdf import FPDF
import os

def create_dummy_pdf(filename="product_manual.pdf"):
    print(f"Generating a dummy PDF: {filename}...")
    pdf = FPDF()
    
    # Page 1
    pdf.add_page()
    pdf.set_font("helvetica", size=16)
    pdf.cell(200, 10, text="Product Manual v1.0", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(10)
    
    pdf.set_font("helvetica", size=12)
    pdf.cell(200, 10, text="Section 1: General Safety Info", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    text1 = ("General safety. Always power off the device before performing any maintenance on "
             "internal components like sensors. Keep the device away from extreme moisture. "
             "Ensure you use a grounded power outlet at all times.")
    pdf.multi_cell(0, 10, text=text1)
    
    # Page 2
    pdf.add_page()
    pdf.set_font("helvetica", size=12)
    pdf.cell(200, 10, text="Section 2: Maintenance and Cleaning", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    text2 = ("The optical sensor is highly sensitive to dust. To clean the optical sensor, first power "
             "off the unit completely. Use a dry microfiber cloth to wipe the surface. "
             "sensor maintenance. Never use water or liquid solvents on the optical lens, as this will "
             "permanently damage the anti-reflective coating. Gently wipe in a circular motion.")
    pdf.multi_cell(0, 10, text=text2)
    
    pdf.output(filename)
    print(f"Created {filename} successfully.")

if __name__ == "__main__":
    create_dummy_pdf()
