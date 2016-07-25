"""Noticeable difference model for CIE Lab color space."""

def cieLabJND(markSize):
    """Calculate the interval for two CIE Lab colors to be noticeable different.

    Calculate the minimum interval needed along CIE L, a, and b axis for two
    colors of a certain size to be noticeably different. Here we use the a model
    proposed by Stone, Szafir, and Setlur:
    http://www.danielleszafir.com/2014CIC_48_Stone_v3.pdf.
    """
    ndL = 5.079 + 0.751 / markSize
    ndA = 5.339 + 1.541 / markSize
    ndB = 5.349 + 2.871 / markSize
    return (ndL, ndA, ndB)
