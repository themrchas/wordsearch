

(function () {



    function listPreRender(ctx) {

        console.log('in listPreRenderr with ctx.wpq', ctx.wpq);
        console.log('in listPreRenderr with ctx', ctx);

        //Apply to ResultsList page.
        if (/ResultsList\/AllItems.aspx$/.test(ctx.ListSchema.PagePath)) {
            for (i = 0; i < ctx.ListSchema.Field.length; i++) {

                

                ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^Title$/, "Hash");

                if (ctx.ListSchema.Field[i].Name == "LinkTitle")
                    ctx.ListSchema.Field[i].style = "width:50px";

            }

        }

        //Change 'Title' to 'Key Word' for Search Results web part or main page
        if (ctx.wpq == "WPQ2" || /KeyWords\/AllItems.aspx$/.test(ctx.ListSchema.PagePath))
            for (i = 0; i < ctx.ListSchema.Field.length; i++) {
                ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^Title$/, "Key Word");
            }


        //Change 'Title' to 'Hash' for Search Results web part
        if (ctx.wpq == "WPQ3")
        for (i = 0; i < ctx.ListSchema.Field.length; i++) {
              ctx.ListSchema.Field[i].DisplayName = ctx.ListSchema.Field[i].DisplayName.replace(/^Title$/, "Hash");
        }

    } //listPreRender


    function listPostRender(ctx) {

        console.log('in listPostRender with ctx', ctx);

        if (typeof jQuery != 'undefined')
            console.log('jQuery version is', jQuery.fn.jquery);
        else
            console.log('jQuery is undefined');


        //Format certain column sizes as well as  certain headers.
        if (/ResultsList\/AllItems.aspx$/.test(ctx.ListSchema.PagePath)) {

            var node = $("div[name='LinkTitle']");

            $(node).width("100");
            $(node).parent().css("text-align", "center");

            node = $("div[name='URL']");
            $(node).width("150");
            $(node).parent().css("text-align", "center");


            $("div[name='Category']").width("100");
            $("div[name='ItemLastModified']").width("100");
            $("div[name='findingComment']").width("300");


        }
        else if (/SearchPaths\/AllItems.aspx$/.test(ctx.ListSchema.PagePath)) {

            var node = $("div[name='URL']");
            $(node).width("150");
            $(node).parent().css("text-align", "center");
        }


    } //listPostRender



    function registerListRenderer() {

   

        var customRenderingOverride = {};

        customRenderingOverride.Templates = {};
        customRenderingOverride.OnPreRender = listPreRender;
        customRenderingOverride.OnPostRender = listPostRender;
     //   customRenderingOverride.Templates.Fields = {
     //       "Category": { "View": formatTimeModified }
     //   }

        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(customRenderingOverride);
        console.log('context is', ctx);

        SPClientTemplates.TemplateManager.RegisterTemplateOverrides(ctx);

    } //registerListRenderer


    ExecuteOrDelayUntilScriptLoaded(registerListRenderer, 'clienttemplates.js');



})();
