/**
 * 我的任务－任务详情
 * Created by wrb on 2020/02/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_details_menu",
        defaults = {
            targetId:null,
            status:null,
            projectId:null,
            productionRowClickCallBack:null,
            productionRenderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._productionDataInfo = {};

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();
        }
        //渲染内容
        ,renderContent:function (t) {
            var that = this;
            var html = template('m_task/m_task_details_menu',{
            });
            $(that.element).html(html);

            that.renderProductionTask();


        }
        //渲染生产安排任务
        ,renderProductionTask:function () {
            var that = this;

            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_listMyTaskForProduct;
            options.postData = {};
            options.postData.status = that.settings.status;
            options.postData.projectId = that.settings.projectId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._productionDataInfo = response.data.data;
                    var html = template('m_task/m_task_details_menu_production',{
                        dataList:response.data.data,
                        targetId:that.settings.targetId
                    });
                    $(that.element).find('.panel-body[data-type="productionTask"]').html(html);
                    that.initICheckByProduction();
                    that.bindActionClickByProduction();
                    //设置任务名称td width
                    $(that.element).find('tr.production-content-row .text-ellipsis').css('width',$(that.element).find('.task-list-box').width()*0.8+'px');
                    $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
                    //生产任务行点击事件
                    $(that.element).find('tr.production-content-row[data-id]').off('click').on('click',function () {

                        var id = $(this).attr('data-id');
                        $(this).addClass('bg-v2-gray').siblings('tr.production-content-row').removeClass('bg-v2-gray');
                        if(that.settings.productionRowClickCallBack)
                            that.settings.productionRowClickCallBack(id);
                    });
                    if(that.settings.productionRenderCallBack)
                        that.settings.productionRenderCallBack();

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化生产任务checkbox
        ,initICheckByProduction:function ($ele) {
            var that = this;

            var　checkAll = function ($this) {

                var checkedLen = $(that.element).find('input[name="taskCk"][value!=""]:checked:not(:disabled)').length;
                var taskLen = $(that.element).find('input[name="taskCk"][value!=""]:not(:disabled)').length;
                if(checkedLen==taskLen){
                    $(that.element).find('input[name="taskCk"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="taskCk"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="taskCk"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="taskCk"][value=""]').iCheck('update');
                }
            };
            var ifChecked = function (e) {

                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全选
                    $(that.element).find('input[name="taskCk"][value!=""]:not(:disabled)').prop('checked',true);
                    $(that.element).find('input[name="taskCk"][value!=""]:not(:disabled)').iCheck('update');
                }
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                if(isNullOrBlank($this.attr('value'))){//全不选
                    $(that.element).find('input[name="taskCk"][value!=""]:not(:disabled)').prop('checked',false);
                    $(that.element).find('input[name="taskCk"][value!=""]:not(:disabled)').iCheck('update');
                }
                checkAll($this);
            };
            $(that.element).find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        ,bindActionClickByProduction:function () {
            var that = this;
            $(that.element).find('a[data-action="batchTaskStateFlow"]').off('click').on('click',function () {
                var $this = $(this);
                var taskList = [],isSameState=true,stateStr='';
                $(that.element).find('input[name="taskCk"][value!=""]:checked').each(function (i) {
                    taskList.push({id:$(this).val()});

                    var status = $(this).attr('data-end-status');
                    if(i==0){
                        stateStr = status;
                    }
                    if(stateStr!=status){
                        isSameState = false;
                    }
                });

                if(taskList.length==0){
                    S_toastr.error('请选择需要批量流转的任务！');
                    return false;
                }
                if(isSameState==false){
                    S_layer.error('当前选择的内容，状态不一致，请重新选择要批量流转的内容！');
                    return false;
                }

                var dataItem = getObjectInArray(that._productionDataInfo,taskList[0].id);


                $('body').m_production_approval_opinion_state_flow({
                    doType:3,
                    isBatch:true,
                    dataInfo:dataItem,
                    postParam:{taskList:taskList},
                    postUrl:restApi.url_projectTask_batchChangeStatusAndComment,
                    projectId:that.settings.projectId,
                    saveCallBack:function () {
                        that.renderProductionTask();
                    }
                },true);

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
