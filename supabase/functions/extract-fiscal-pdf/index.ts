import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, extractedText } = await req.json();
    
    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Texto extraído está vazio' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração de IA não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando PDF: ${filename}`);

    const systemPrompt = `Você é um extrator especializado de dados fiscais brasileiros. 
Analise o texto do demonstrativo fiscal e extraia os seguintes dados:

1. Nome da empresa (completo, sem LTDA/EIRELI/etc)
2. CNPJ (apenas números, sem formatação)
3. Período/Competência (formato MM/YYYY)
4. Valores monetários (em R$):
   - Entradas/Receitas (total de entradas, vendas, receitas)
   - Saídas/Despesas (total de saídas, compras, custos)
   - Serviços (se houver movimento de serviços)
   - ICMS (se houver)
   - PIS (se houver)
   - COFINS (se houver)

IMPORTANTE:
- Extraia APENAS valores que estão claramente identificados no documento
- Se não encontrar um valor específico, retorne null para esse campo
- Converta valores para número (sem R$, pontos ou vírgulas)
- Para valores com vírgula decimal, converta para ponto decimal
- O período deve estar no formato MM/YYYY (ex: 01/2025, 12/2024)

Retorne APENAS um objeto JSON válido sem nenhum texto adicional, seguindo este formato:
{
  "empresa": "NOME DA EMPRESA",
  "cnpj": "12345678901234",
  "periodo": "MM/YYYY",
  "entradas": 123456.78,
  "saidas": 98765.43,
  "servicos": 0.00,
  "icms": 1234.56,
  "pis": 234.56,
  "cofins": 456.78,
  "regime_tributario": "simples_nacional"
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Extraia os dados fiscais deste documento:\n\n${extractedText.substring(0, 30000)}` 
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Erro na API de IA:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Limite de requisições excedido. Aguarde alguns minutos e tente novamente.' 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Créditos de IA esgotados. Adicione créditos em Configurações > Workspace > Uso.' 
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('Resposta da IA vazia');
      return new Response(
        JSON.stringify({ success: false, error: 'IA não retornou dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resposta da IA:', content);

    // Tentar extrair JSON da resposta
    let extractedData;
    try {
      // Remover blocos de código markdown se existirem
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      extractedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError, 'Conteúdo:', content);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Não foi possível extrair dados estruturados do documento' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar dados mínimos
    if (!extractedData.cnpj || !extractedData.periodo) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados essenciais (CNPJ ou período) não encontrados no documento' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpar CNPJ (apenas números)
    extractedData.cnpj = extractedData.cnpj.replace(/\D/g, '');
    
    // Validar CNPJ (14 dígitos)
    if (extractedData.cnpj.length !== 14) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `CNPJ inválido: ${extractedData.cnpj}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Dados extraídos com sucesso: ${extractedData.empresa} (${extractedData.cnpj})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no processamento:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
