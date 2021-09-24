/**
 * 生产安排-校审意见-状态流转
 * Created by wrb on 2019/7/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_approval_opinion_state_flow",
        defaults = {
            isDialog:true,
            doType:1,//1=校审，2=设计文件，3=生产安排
            projectId:null,
            dataInfo:null,//状态信息
            handler:null,//处理人
            id:null,//当前记录ID
            postParam:null,
            postUrl:null,
            isBatch:false,//是否批量
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        if(this.settings.doType==2){
            this.settings.dataInfo.status = this.settings.dataInfo.fileStatus;
            this.settings.dataInfo.statusName = this.settings.dataInfo.fileStatusName;
        }
        if(this.settings.doType==3){
            this.settings.dataInfo.status = this.settings.dataInfo.endStatus;
            this.settings.dataInfo.statusName = this.settings.dataInfo.endStatusName;
        }

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getStatusList(that.settings.id,function (data) {
                var html = template('m_production/m_production_approval_opinion_state_flow',{
                    statusList:data,doType:that.settings.doType,
                    status:that.settings.dataInfo.status
                });
                that.renderDialog(html,function () {
                    if(that.settings.doType==2||that.settings.doType==3){//设计文件、生产安排

                        that.bindBtnStatusClick(function () {
                        });

                    }else{
                        that.bindBtnStatusClick(function () {
                            that.setUsersByStatus();
                        });
                    }

                });
            });
        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'状态流转',
                    area : '650px',
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if($(that.element).find('form').valid()){
                            that.save();
                        }else{
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //查询状态列表
        ,getStatusList:function (id,callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_listCandidateStatus;

            if(that.settings.doType==2)
                options.url=restApi.url_projectSkyDriver_listCandidateStatus;

            if(that.settings.doType==3)
                options.url=restApi.url_projectTask_listCandidateStatus;

            options.postData = {
                id:that.settings.dataInfo.id,
                status:that.settings.dataInfo.status,
                projectId:that.settings.projectId,
                companyId:that._currentCompanyId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    var data = response.data;
                    if(data){
                        var nodeList = [],newNodeList = [];
                        $.each(data,function (i,item) {
                            if(item.nodeValue==that.settings.dataInfo.status){
                                nodeList.push(item);
                            }else{
                                newNodeList.push(item);
                            }
                        });
                        data = nodeList.concat(newNodeList)
                    }

                    if(callBack)
                        callBack(data);

                }else {
                    S_layer.error(response.info);
                }
            });
        }



        ,save:function () {
            var that = this;
            var status = $(that.element).find('form button.btn-status.selected').attr('data-status');

            var option={};
            option.classId = '#content-right';
            option.url=that.settings.postUrl || restApi.url_saveApprovalOpinion;//restApi.url_commentProjectTask;
            option.postData = {};
            if(that.settings.isBatch==false){
                option.postData.id = that.settings.dataInfo.id;
            }
            if(that.settings.doType==2){
                option.url=that.settings.postUrl || restApi.url_projectSkyDriver_saveFileStatus;
                option.postData.fileStatus = status;
                option.postData.projectId = that.settings.projectId;

            }else if(that.settings.doType==3){

                option.url=that.settings.postUrl || restApi.url_projectTask_changeStatusAndComment;
                option.postData.endStatus = status;
                if(status=='status_complete'){
                    option.postData.completeDate = getNowDate();
                }
            }else{

                option.postData.status = status;
                option.postData.isUpdateExecuters = 1;
            }

            if(that.settings.postParam){
                option.postData = $.extend({}, option.postData, that.settings.postParam);
            }


            m_ajax.postJson(option,function (response) {

                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            });

        }
        //btn stauts点击事件
        ,bindBtnStatusClick:function (callBack) {
            var that = this;
            $(that.element).find('button.btn-status').on('click',function () {
                $(this).addClass('selected').siblings().removeClass('selected');
                var index = $(this).index();
                if(callBack)
                    callBack();

                return false;
            });
        }
    });

    /*
      1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
      2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
      3.调用方法： $('#id').pluginName('methodName',args);
      */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
