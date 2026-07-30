import os
import requests
import json
from decimal import Decimal
from django.conf import settings
from pdv.models import NotaFiscal, Comanda

FOCUS_NFE_URL = "https://api.focusnfe.com.br/v2/nfce"
FOCUS_NFE_TOKEN = os.environ.get("FOCUS_NFE_TOKEN", "")

def emitir_nota_fiscal(comanda_id):
    """
    Emite uma NFC-e na API da Focus NFe usando o token configurado.
    """
    try:
        comanda = Comanda.objects.get(id=comanda_id)
    except Comanda.DoesNotExist:
        return {"sucesso": False, "mensagem": "Comanda não encontrada"}
        
    # Pega ou cria a nota
    nota, created = NotaFiscal.objects.get_or_create(comanda=comanda)
    
    if nota.status == 'emitida':
        return {"sucesso": False, "mensagem": "Nota já emitida"}
    
    # Prepara payload
    payload = {
        "natureza_operacao": "Venda de mercadoria",
        "data_emissao": nota.criado_em.isoformat(),
        "itens": [],
        "pagamentos": []
    }
    
    for i, item in enumerate(comanda.itens.all(), 1):
        payload["itens"].append({
            "numero_item": i,
            "codigo_produto": str(item.produto.id),
            "descricao": item.produto.nome,
            "cfop": "5102",
            "ncm": "21069090",
            "quantidade": item.quantidade,
            "valor_unitario_comercial": float(item.preco_unitario),
            "valor_bruto": float(item.quantidade * item.preco_unitario),
            "icms_situacao_tributaria": "102"
        })
        
    for pag in comanda.pagamentos.all():
        forma = "01" if pag.forma_pagamento == 'DINHEIRO' else ("03" if pag.forma_pagamento == 'CREDITO' else "04" if pag.forma_pagamento == 'DEBITO' else "17")
        payload["pagamentos"].append({
            "forma_pagamento": forma,
            "valor_pagamento": float(pag.valor)
        })

    if not FOCUS_NFE_TOKEN:
        return {"sucesso": False, "mensagem": "Token da Focus NFe não configurado. Verifique o arquivo .env"}
        
    try:
        response = requests.post(
            f"{FOCUS_NFE_URL}?ref={nota.referencia}",
            auth=(FOCUS_NFE_TOKEN, ""),
            json=payload
        )
        
        data = response.json()
        
        if response.status_code in [200, 202]:
            nota.status = 'processando'
            if data.get('status') == 'autorizado':
                nota.status = 'emitida'
                nota.chave_acesso = data.get('chave_nfe')
                nota.caminho_xml = data.get('caminho_xml_nota_fiscal')
                nota.caminho_pdf = data.get('caminho_danfe')
                nota.mensagem_sefaz = data.get('mensagem_sefaz')
            nota.save()
            return {"sucesso": True, "mensagem": "Nota processada na Sefaz", "nota": {"id": nota.id}}
        else:
            nota.status = 'erro'
            nota.mensagem_sefaz = data.get('mensagem', 'Erro na emissão')
            nota.save()
            return {"sucesso": False, "mensagem": nota.mensagem_sefaz}
            
    except Exception as e:
        nota.status = 'erro'
        nota.mensagem_sefaz = str(e)
        nota.save()
        return {"sucesso": False, "mensagem": f"Erro de conexão: {str(e)}"}
