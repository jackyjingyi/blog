/**
 * 轻量任务模板编辑
 * Created by wrb on 2019/12/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_temp_edit",
        defaults = {
            isDialog:true,
            doType:1,//1==普通模板，2=copy任务为模板
            templateId:null,
            projectName:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {
            type:0,//模板
            groupList:[],
            id:this.settings.templateId || UUID.genV4().hexNoDelim,
            projectName:this.settings.projectName,
            templateId:this.settings.templateId
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_light_project/m_light_project_temp_edit', {
                projectName:that.settings.projectName
            });
            that.renderDialog(html,function () {
                that.bindActionClick();
                $(that.element).find('a[data-action="editBaseInfo"]').click();

                $(that.element).find('.panel-body').m_light_project_detail({
                    doType:2,
                    dataInfo:that._dataInfo,
                    query:{id:that._dataInfo.id}
                },true);
            });
        }
        //渲染弹窗
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    area : ['100%','100%'],
                    content:html,
                    closeBtn:0,
                    fixed:true,
                    scrollbar:false,
                    //anim:1,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,dealData:function (data) {
            var that = this;
            var dataInfo = $.extend(true, {}, that._dataInfo);
            delete dataInfo.id;
            if(data){
                if(data.groupList && data.groupList.length>0){
                    $.each(data.groupList,function (i,item) {
                        //清空ID
                        $.each(item.detailList,function (ci,citem) {
                            delete citem.id;
                            $.each(citem.checkItemList,function (cci,ccitem) {
                                delete ccitem.id;
                            });
                        });
                        dataInfo.groupList.push({
                            groupName:item.group.name,
                            type:2,
                            detailList:item.detailList
                        })
                    })
                }
            }
            return dataInfo;
        }
        ,saveProjectTemp:function (data) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_saveLightProjectTemplate;
            option.postData = that.dealData(data);
            if(that.settings.templateId)
                option.postData.templateId = that.settings.templateId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    S_layer.close($(that.element));
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'closeDialog':
                        S_layer.close($(that.element));
                        break;
                    case 'editBaseInfo':

                        $('body').m_light_project_temp_add_simple({
                            dataInfo:that._dataInfo,
                            saveCallBack:function (data) {
                                $.extend(that._dataInfo, data);
                                $(that.element).find('.project-name').html(that._dataInfo.projectName);
                            }
                        });

                        break;

                    case 'saveProjectTemp'://保存模板

                        $(that.element).find('.panel-body').m_light_project_detail('getProjectInfoData',function (data) {

                            console.log(data);
                            that.saveProjectTemp(data);

                        });

                        break;

                }
                return;

            });
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
