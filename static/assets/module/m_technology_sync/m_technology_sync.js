/**
 * 技术协同 type:1:技术委员会、2：委员成员、3会议纪要、4：获奖情况
 * Created by wrb on 2019/6/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_technology_sync",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function(){
                var html = template('m_technology_sync/m_technology_sync',{dataInfo:that._dataInfo});
                $(that.element).html(html);
                that.bindClickAction();
                that.editHoverFun();
                that.bindTrActionClick();
                $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
                rolesControl();
            })

        }

        //获取数据
        ,getData:function (callBack) {
            var that = this;
            var options={};
            options.url=restApi.url_getAllList;
            options.postData = {};

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack();

                }else {
                    S_layer.error(response.info);
                }
            })


        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('.content-row-item-left');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xDelete"],a[data-action="xEdit"]').each(function () {

                var $this = $(this);

                $this.closest('.content-row-item-left').hover(function () {
                    $this.css('visibility','visible');
                },function () {
                    $this.css('visibility','hidden');
                })
            });

            $(that.element).find('.vertical-timeline-block').off('mouseenter').unbind('mouseleave').hover(function () {

                $(this).find('a').show();

            },function () {
                $(this).find('a').hide();
            });
        }
        //行事件绑定
        , bindTrActionClick: function () {
            var that = this;
            $.each($(that.element).find('div[data-action="fileAction"]'), function (i, o) {
                $(o).off('click.fileAction').on('click.fileAction', function () {
                    window.open($(this).attr('data-src'));
                })
            });
            $.each($(that.element).find('div[data-action="dynamicsAction"]'), function (i, o) {
                $(o).off('click.dynamicsAction').on('click.dynamicsAction', function () {
                    var $this = $(this);
                    var content = $this.attr("data-content");
                    var date = $this.attr("data-date");
                    var title = $this.attr("data-title");
                    var type = $this.attr("data-type");
                    $('body').m_technology_show({
                        type: type,
                        content:content,
                        title2:title,
                        date:date,
                        saveCallBack: function () {
                            that.init();
                        }
                    }, true);
                })
            });

            var $ele = $(that.element).find('.content-row-item-left');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="xDelete"],a[data-action="xEdit"]').on('click', function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.attr('data-value');
                var dataKey = $this.attr('data-key');
                //获取节点数据
                switch (dataAction) {
                    case 'xDelete'://删除

                        S_layer.confirm('确定删除该条数据吗？',function(){
                            var option={};
                            option.url=restApi.url_deleteSynergyInfo;
                            option.postData = {
                                id:dataId
                            };
                            m_ajax.postJson(option,function (response) {
                                if(response.code=='0'){
                                    S_toastr.success('操作成功！');
                                    that.init();
                                }else {
                                    S_layer.error(response.info);
                                }
                            });
                        },function(){
                            //S_layer.close($(event));
                        });
                        return false;
                        break;
                    case 'xEdit'://编辑
                        //获取节点数据

                        if(dataKey=='summaryFile'){
                            var dataItem = getObjectInArray(that._dataInfo.summaryFiles,dataId);
                            $('body').m_technology_add({
                                type: 3,
                                id:dataId,
                                dataItem:dataItem,
                                saveCallBack: function () {
                                    that.init();
                                }
                            }, true);
                        }else if(dataKey=='awards'){
                            var dataItem = getObjectInArray(that._dataInfo.awardsList,dataId);
                            $('body').m_technology_edit({
                                type: 4,
                                id:dataId,
                                tempData:dataItem.content,
                                saveCallBack: function () {
                                    that.init();
                                }
                            }, true);
                        }
                        return false;
                        break;

                }
                stopPropagation(e);
                return false;

            });
            $(that.element).find('a[data-action="editProjectNotice"],a[data-action="delProjectNotice"]').on('click', function (e) {
                    var $this = $(this);
                    var dataAction = $this.attr('data-action');
                    var dataId = $this.attr('data-value');
                    var dataKey = $this.attr('data-key');
                    //获取节点数据
                    switch (dataAction) {
                        case 'editProjectNotice'://编辑项目动态
                            $('body').m_technology_dynamics_edit({
                                projectId:that.settings.projectId,
                                title :'编辑创新技术委员会信息动态' ,
                                dataInfo:{
                                    id:$this.closest('.vertical-timeline-block').attr('data-id'),
                                    title:$this.closest('.vertical-timeline-block').find('h4').attr('data-value'),
                                    content:$this.closest('.vertical-timeline-block').find('p.noticeContent').html(),
                                    publishDate:$this.closest('.vertical-timeline-block').find('p.noticePublishdate').attr('data-value')
                                },
                                saveCallBack:function (data) {
                                    that.init();
                                }
                            });

                            break;
                        case 'delProjectNotice'://删除项目动态
                            S_layer.confirm('删除后将不能恢复，您确定要删除吗？',function(){
                                var option={};
                                option.url=restApi.url_deleteSynergyInfo;
                                option.postData = {
                                    id:$this.closest('.vertical-timeline-block').attr('data-id')
                                };
                                m_ajax.postJson(option,function (response) {
                                    if(response.code=='0'){
                                        S_toastr.success('操作成功！');
                                        that.init();
                                    }else {
                                        S_layer.error(response.info);
                                    }
                                });
                            },function(){
                                //S_layer.close($(event));
                            });

                            break;

                    }
                    stopPropagation(e);
                    return false;

                });
        }

        //事件绑定
        , bindClickAction: function () {
            var that = this;
            $(that.element).find('a[data-action]')
                .off('click').bind('click', function () {

                var $this = $(this),
                    dataAction = $this.attr('data-action');

                switch (dataAction) {


                    case 'committeeDesc'://

                        $('body').m_technology_edit({
                            type: 1,
                            tempData:that._dataInfo.committee.content,
                            id:that._dataInfo.committee.id,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                    case 'committeeMember'://

                        $('body').m_technology_edit({
                            type: 2,
                            tempData: that._dataInfo.member.content,
                            id: that._dataInfo.member.id,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                    case 'addCommitteeRecord'://添加任务订单

                        $('body').m_technology_add({
                            type: 3,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                    case 'addAward'://

                        $('body').m_technology_edit({
                            type: 4,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                    case 'addDynamics'://
                        $('body').m_technology_dynamics_edit({
                            projectId:that.settings.projectId,
                            title :'添加创新技术委员会信息动态' ,
                            saveCallBack:function (data) {
                                that.init();
                            }
                        });
                        break;
                    case 'checkSummaryFiles'://

                        $(that.element).m_technology_show_more({
                            type: 3,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;
                    case 'checkAward'://

                        $(that.element).m_technology_show_more({
                            type: 4,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;


                }
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
