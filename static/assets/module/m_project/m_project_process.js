/**
 * 基本信息－项目进度
 * Created by wrb on 2020/6/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_process",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            businessType:1,//1：业务类型，2：研发类型
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._editFlag = this.settings.editFlag;
        this._isView = this.settings.isView;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_getProjectCostSummaryForBasic;
            option.postData = {projectId:that.settings.projectId};

            if(that.settings.businessType==2){
                option.url = restApi.url_getProjectProgress;
                option.postData = {id:that.settings.projectId};
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    if(that.settings.businessType==2 && response.data){
                        response.data.progressRate = response.data.taskProgressRatio;
                    }

                    var html = template('m_project/m_project_process',{dataInfo:response.data,businessType:that.settings.businessType,totalRatio:that.settings.totalRatio});
                    $(that.element).html(html);
              /*      if (!that._isView && that._editFlag == 1) {
                        dragBar('progress', 'progress-bar', function (data) {
                            that.saveProgress(data);
                        });
                    }*/
                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        ,saveProgress:function (progressRate) {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = that.element;
            options.postData = {};

            options.postData.progressRate = progressRate;
            options.postData.id = that.settings.projectId;

            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {

                    //S_toastr.success('操作成功');
                    that.init();
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);


