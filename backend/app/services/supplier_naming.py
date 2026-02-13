"""
Service pour déterminer le nom du fournisseur basé sur la logique métier.
"""
from typing import Optional


def get_supplier_name(code: Optional[str], info10: Optional[str]) -> str:
    """
    Détermine le nom du fournisseur basé sur le code fournisseur et Info10 A.
    
    Args:
        code: N° Compte Fournisseur Principal (ART_FOURPRINC)
        info10: Info10 A (infolibre10)
    
    Returns:
        Le nom du fournisseur selon la logique métier
    """
    # Normaliser les valeurs
    code = str(code).strip() if code else ""
    info10 = str(info10).strip() if info10 else ""
    
    # Logique de la formule fournie
    if code in ["40B014", "40T171", "40T174", "40T175", "40T176"]:
        if info10 == "PRO":
            return "ATTAR PRO"
        else:
            return "ATTAR"
    
    elif code in ["40L068", "40L069"]:
        if info10 == "PRO":
            return "LRF PRO"
        elif info10 == "DUB":
            return "LE RELAIS FR DUB"
        else:
            return "LE RELAIS FR"
    
    elif code == "40E225":
        if info10 == "PRO":
            return "EUROTEX PRO"
        else:
            return "EUROTEX"
    
    elif code == "40L070":
        return "LRM SBR"
    
    elif code == "40L177":
        return "LRM ABR"
    
    elif code == "40R106":
        if info10 == "PRO":
            return "RECU PRO"
        else:
            return "RECUTEX"
    
    elif code == "40S124":
        return "SOEX ALL"
    
    elif code == "40S126":
        return "SOEX DUB"
    
    elif code == "40T143":
        if info10 == "O":
            return "TTR/O"
        elif info10 == "N":
            return "TTR/N"
        elif info10 in ["N-PRO", "PRO", "O-PRO", "T-PRO"]:
            return "TTR/PRO"
        else:
            return "TTR/T"
    
    elif code in ["40T173", "40T169"]:
        return "TTR ANCIENS"
    
    elif code == "40G243":
        if info10 == "PRO":
            return "G-TEX PRO"
        else:
            return "GENERAL-TEX"
    
    elif code == "40R244":
        if info10 == "PRO":
            return "RIMATEX PRO"
        else:
            return "RIMATEX BVBA"
    
    else:
        return "ANCIENS FRNS"
